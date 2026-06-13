"use client"

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react';
import { calculateProfitMetrics, getGrandfatheredRate, isLongTerm } from '@/components/helper/utility';
import { bulkLedgerUpdateAction } from '@/lib/actions/admin/admin-bulk-ops';
import { parse } from 'csv-parse/browser/esm/sync';
import { useLoading } from '@/components/helper/loading-context';

const formatCsvDate = (dateStr: string) => {
    if (!dateStr) return dateStr;
    // Support both DD/MM/YYYY and DD-MM-YYYY
    const separator = dateStr.includes('-') ? '-' : dateStr.includes('/') ? '/' : null;
    if (!separator) return dateStr;
    const parts = dateStr.split(separator);
    if (parts.length === 3) {
        // Always return with hyphens for the database (YYYY-MM-DD)
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
};

export default function BulkSalesAdd() {
    const { setIsLoading } = useLoading();
    const supabase = createClient();
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [loading, setLoading] = useState(false);
    const [shortfalls, setShortfalls] = useState<any[]>([]);
    const [successCount, setSuccessCount] = useState<number | null>(null);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setIsLoading(true);
        setShortfalls([]);
        setSuccessCount(null);
        setProgress(0);
        setStatusText("Initializing batch...");

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const fileContent = await file.text();

            const salesToProcess = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });

            if (salesToProcess.length === 0) {
                throw new Error("CSV file is empty or invalid.");
            }

            setStatusText("Fetching current holdings...");
            const [{ data: allPurchases }, { data: allClients }, { data: nextId }] = await Promise.all([
                supabase.from('purchases').select('*').gt('balance_qty', 0).order('date', { ascending: true }),
                supabase.from('clients').select('client_id, client_name'),
                supabase.rpc('get_next_sale_id')
            ]);

            const uniqueTickers = Array.from(new Set(salesToProcess.map((s: any) => s.ticker?.trim())));
            setStatusText(`Fetching grandfathered rates for ${uniqueTickers.length} assets...`);

            const rateEntries = await Promise.all(
                uniqueTickers.filter(Boolean).map(async (ticker) => {
                    const rate = await getGrandfatheredRate(supabase, (ticker as string));
                    return [ticker, rate];
                })
            );
            const rateMap = new Map<string, number>(rateEntries as any);
            const clientMap = new Map(allClients?.map(c => [c.client_name.trim().toLowerCase(), c.client_id]));
            let localPurchases = [...(allPurchases || [])];
            let currentLocalId = Number(nextId || 1);

            const salesToInsert = [];
            const purchasesToUpdateMap = new Map();
            const shortfallErrors = [];

            for (let i = 0; i < salesToProcess.length; i++) {
                const row = salesToProcess[i] as any;
                const percent = Math.round(((i + 1) / salesToProcess.length) * 100);
                setProgress(percent);
                setStatusText(`Processing row ${i + 1} of ${salesToProcess.length}...`);

                const clientName = (row.client_name || row.sale_client_name || row['Client Name'] || "").trim();
                const ticker = (row.ticker || row.Symbol || row.Ticker || "").trim();
                const rawQty = row.sale_qty || row.qty || row['Sale Quantity'] || row.Units;
                const saleQtyRequested = parseFloat(String(rawQty || 0).replace(/,/g, ''));
                const rawRate = row.rate || row.price || row['Sale Rate'] || row.Price;
                const saleRate = parseFloat(String(rawRate || 0).replace(/,/g, ''));
                const rawDate = row.sale_date || row.date || row['Sale Date'];
                const saleDateStr = formatCsvDate(rawDate?.trim());

                if (!ticker || isNaN(saleQtyRequested) || isNaN(saleRate) || !clientName) {
                    continue;
                }

                currentLocalId++;
                const clientId = clientMap.get(clientName.toLowerCase());
                if (!clientId) {
                    throw new Error(`Client "${clientName}" not found at row ${i + 2}. Please create the client first.`);
                }
                const cutoffPrice = rateMap.get(ticker) || 0;
                const sharedCustomId = `SALE-${currentLocalId.toString().padStart(4, '0')}`;

                const saleDateOnlyInner = new Date(saleDateStr).toISOString().split('T')[0];

                let availableLots = localPurchases.filter(p =>
                    p.client_name?.trim().toLowerCase() === clientName.toLowerCase() &&
                    p.ticker?.trim().toLowerCase() === ticker.toLowerCase() &&
                    p.balance_qty > 0 &&
                    new Date(p.date) <= new Date(saleDateStr)
                );

                const bulkSameDayPurchases = availableLots.filter(p => {
                    const pDateOnly = new Date(p.date).toISOString().split('T')[0];
                    return pDateOnly === saleDateOnlyInner;
                });

                const bulkOtherPurchases = availableLots.filter(p => {
                    const pDateOnly = new Date(p.date).toISOString().split('T')[0];
                    return pDateOnly !== saleDateOnlyInner;
                });

                availableLots = [...bulkSameDayPurchases, ...bulkOtherPurchases];

                let remainingQty = saleQtyRequested;

                for (let lot of availableLots) {
                    if (remainingQty <= 0) break;

                    const qtyFromThisLot = Math.min(lot.balance_qty, remainingQty);
                    const { profit, adjusted_profit } = calculateProfitMetrics(
                        lot.rate, new Date(lot.date), saleRate, cutoffPrice, qtyFromThisLot
                    );

                    const saleTrxId = crypto.randomUUID();

                    salesToInsert.push({
                        trx_id: saleTrxId,
                        purchase_trx_id: lot.trx_id,
                        custom_id: sharedCustomId,
                        client_name: clientName,
                        client_id: clientId,
                        date: saleDateStr,
                        rate: saleRate,
                        sale_qty: qtyFromThisLot,
                        profit_stored: profit,
                        adjusted_profit_stored: adjusted_profit,
                        long_term: isLongTerm(new Date(lot.date), new Date(saleDateStr)),
                        user_id: user?.id
                    });

                    lot.balance_qty = Number((lot.balance_qty - qtyFromThisLot).toFixed(4));
                    lot.sale_ids = [...(lot.sale_ids || []), saleTrxId];
                    purchasesToUpdateMap.set(lot.trx_id, { ...lot });

                    remainingQty -= qtyFromThisLot;
                }

                if (remainingQty > 0.0001) {
                    shortfallErrors.push({
                        client: clientName,
                        ticker: ticker,
                        requested: saleQtyRequested,
                        available: saleQtyRequested - remainingQty,
                        missing: remainingQty,
                        row: i + 2
                    });
                }
            }

            setShortfalls(shortfallErrors);

            if (shortfallErrors.length > 0) {
                const proceed = window.confirm(`Found ${shortfallErrors.length} inventory shortfalls. Proceed with partial allocation?`);
                if (!proceed) {
                    setLoading(false);
                    return;
                }
            }

            setStatusText("Syncing with database...");
            await bulkLedgerUpdateAction({
                sales_to_insert: salesToInsert,
                purchases_to_update: Array.from(purchasesToUpdateMap.values())
            });

            setSuccessCount(salesToProcess.length);
            setStatusText("Success!");
        } catch (err: any) {
            console.error(err);
            alert(`Bulk Sales Add Failed: ${err.message}`);
        } finally {
            setLoading(false);
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors min-h-[250px] flex flex-col justify-between">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <UploadCloud size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Add Sales</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Import historical sales and auto-match with FIFO lots.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
                        <input
                            type="file"
                            accept=".csv"
                            disabled={loading}
                            onChange={handleFileChange}
                            className="block w-full max-w-xs text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-900/30 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 cursor-pointer transition-all"
                        />
                        <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">Required: client_name, ticker, sale_qty, sale_rate, sale_date</p>
                    </div>

                    {loading && (
                        <div className="animate-in fade-in">
                            <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                                <span>{statusText}</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
                                <div className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    )}

                    {successCount !== null && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm transition-colors">
                            <CheckCircle2 size={18} />
                            <span>Successfully processed {successCount} sales.</span>
                        </div>
                    )}
                </div>
            </div>

            {shortfalls.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-6 transition-colors">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 mb-4">
                        <AlertCircle size={20} />
                        <h4 className="font-bold">Inventory Shortfalls</h4>
                    </div>
                    <div className="max-h-60 overflow-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="sticky top-0 bg-amber-50 dark:bg-amber-900/40 backdrop-blur-sm text-amber-900 dark:text-amber-200 font-bold border-b border-amber-200 dark:border-amber-900/50">
                                <tr>
                                    <th className="py-2">Row</th>
                                    <th className="py-2">Client</th>
                                    <th className="py-2">Ticker</th>
                                    <th className="py-2">Missing Qty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100 dark:divide-amber-900/30">
                                {shortfalls.map((s, idx) => (
                                    <tr key={idx} className="text-amber-700 dark:text-amber-400/80">
                                        <td className="py-2">{s.row}</td>
                                        <td className="py-2">{s.client}</td>
                                        <td className="py-2">{s.ticker}</td>
                                        <td className="py-2 font-mono">{s.missing.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
