"use client"

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { parse } from 'csv-parse/browser/esm/sync';
import { bulkLedgerUpdateAction } from '@/lib/actions/admin-bulk-ops';

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

export default function BulkPurchaseAdd() {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [successCount, setSuccessCount] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);
        setSuccessCount(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const fileContent = await file.text();

            const data = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });

            if (data.length === 0) throw new Error("CSV is empty.");

            const purchasesToInsert = data.map((row: any, idx: number) => {
                const purchase_qty = parseFloat(String(row['Purchase Quantity'] || 0).replace(/,/g, ''));
                const rate = parseFloat(String(row.rate || row['Purchase Rate'] || 0).replace(/,/g, ''));
                const date = formatCsvDate((row.date || row['Purchase Date'] || "").trim());
                const ticker = (row.ticker || row.Symbol || "").trim();
                const client_name = (row.client_name || row['Client Name'] || "").trim();
               
                if (!ticker || !client_name || isNaN(purchase_qty) || isNaN(rate) || !date) {
                    throw new Error(`Invalid data at row ${idx + 2}`);
                }

                return {
                    user_id: user?.id,
                    client_name,
                    ticker,
                    date,
                    rate,
                    purchase_qty,
                    balance_qty: purchase_qty,
                    comments: row.comments || "Bulk Import"
                };
            });

            await bulkLedgerUpdateAction({
                purchases_to_insert: purchasesToInsert,
                sales_to_insert: [],
                purchases_to_update: []
            });

            setSuccessCount(purchasesToInsert.length);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors min-h-[250px] flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <UploadCloud size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Add Purchases</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Fast-track ledger setup by importing buy transactions.</p>
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
                    <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">Required: client_name, ticker, qty, rate, date</p>
                </div>

                {loading && <p className="text-xs text-indigo-600 dark:text-indigo-400 animate-pulse text-center">Processing import...</p>}

                {successCount !== null && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm transition-colors">
                        <CheckCircle2 size={18} />
                        <span>Successfully imported {successCount} purchases.</span>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 rounded-lg flex items-center gap-3 text-rose-700 dark:text-rose-400 text-sm transition-colors">
                        <AlertCircle size={18} />
                        <span>Error: {error}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
