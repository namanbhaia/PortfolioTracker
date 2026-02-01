"use client"

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Download, Loader2, FileSpreadsheet } from 'lucide-react';
import { exportToExcel } from '@/lib/actions/excel-export';
import HoldingsFilters from '@/components/ui/holdings-filters';
import { useUser } from '@/components/helper/user-context';
import { fetchExportData } from '@/lib/actions/fetch-export-data';

export default function ExportPage() {
    const supabase = createClient();
    const { clients } = useUser();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            // --- 1. PREPARE FILTERS ---
            const startDate = searchParams.get('start_date');
            const endDate = searchParams.get('end_date');
            const ticker = searchParams.get('ticker');
            const shareName = searchParams.get('share_name');
            const isLongTerm = searchParams.get('long_term');
            
            const selectedClientIds = searchParams.get('client_ids')?.split(',') || [];
            const selectedClientNames = clients
                .filter(c => selectedClientIds.includes(c.client_id))
                .map(c => c.client_name);

            // --- 2. FETCH DATA ---
            const { purchases, sales } = await fetchExportData(
                supabase,
                { clients: selectedClientNames, ticker },
                { start: startDate, end: endDate }
            );

            if (purchases.length === 0 && sales.length === 0) {
                alert("No records found for the selected range.");
                setLoading(false);
                return;
            }

            // --- 3. FORMAT & POST-PROCESS ---
            
            // Format Purchases
            let formattedPurchases = purchases.map((p: any) => ({
                date: p.date,
                client_name: p.client_name,
                dp_id: p.clients?.dp_id || '-',
                trading_id: p.clients?.trading_id || '-',
                ticker: p.ticker,
                stock_name: p.assets?.stock_name || p.stock_name || '-',
                rate: Number(p.rate) || 0,
                qty: Number(p.purchase_qty) || 0,
                total_cost: (Number(p.rate) * Number(p.purchase_qty)) || 0,
                comments: p.comments,
                trx_id: p.trx_id
            }));

            // Format Sales (Using STORED Profit columns)
            let formattedSales = sales.map((s: any) => {
                const parent = s.purchases || {};

                return {
                    date: s.date,
                    client_name: parent.client_name || '-',
                    dp_id: parent.clients?.dp_id || '-',
                    trading_id: parent.clients?.trading_id || '-',
                    ticker: parent.ticker || '-',
                    stock_name: parent.assets?.stock_name || '-',
                    purchase_date: parent.date,
                    purchase_rate: parent.rate,
                    rate: Number(s.rate) || 0,
                    qty: Number(s.sale_qty) || 0,
                    sale_value: (Number(s.rate) * Number(s.sale_qty)) || 0,
                    long_term: s.long_term ? 'Yes' : 'No',
                    
                    // USE STORED COLUMNS
                    pl: s.profit_stored || 0,
                    adjusted_pl: s.adjusted_profit_stored || 0,
                    
                    comments: s.comments,
                    purchase_trx_id: s.purchase_trx_id,
                    custom_id: s.custom_id,
                    trx_id: s.trx_id,
                    _isLongTerm: s.long_term // Helper for filtering
                };
            });

            // --- 4. APPLY IN-MEMORY FILTERS ---            
            if (shareName) {
                const lowerName = shareName.toLowerCase();
                formattedPurchases = formattedPurchases.filter(p => p.stock_name.toLowerCase().includes(lowerName));
                formattedSales = formattedSales.filter(s => s.stock_name.toLowerCase().includes(lowerName));
            }

            // --- 5. EXPORT ---
            await exportToExcel(
                formattedPurchases, 
                formattedSales, 
                `Portfolio_Export_${startDate || 'Start'}_to_${endDate || 'Now'}`
            );

        } catch (err: any) {
            console.error(err);
            alert(`Export Failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <FileSpreadsheet className="text-emerald-600" /> 
                    Data Export
                </h1>
                <p className="text-slate-500 mt-2">
                    Download combined historical and active ledgers for analysis.
                </p>
            </header>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <HoldingsFilters
                    availableClients={clients || []} 
                    showLongTermToggle={false} 
                    showBalanceToggle={false} 
                />

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="text-xs text-slate-400 italic">
                        * Merges data from both Active and Archived financial years automatically.
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={loading}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-200 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Download size={20} />}
                        {loading ? 'Generating File...' : 'Download Excel Report'}
                    </button>
                </div>
            </div>
        </div>
    );
}