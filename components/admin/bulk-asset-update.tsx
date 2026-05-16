"use client"

import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { bulkAssetUpdateAction } from '@/lib/actions/admin/admin-bulk-ops';
import { parse } from 'csv-parse/browser/esm/sync';
import { useLoading } from '@/components/helper/loading-context';

export default function BulkAssetUpdate() {
    const { setIsLoading } = useLoading();
    const [loading, setLoading] = useState(false);
    const [successCount, setSuccessCount] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setIsLoading(true);
        setError(null);
        setSuccessCount(null);

        try {
            const fileContent = await file.text();

            const data = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });

            if (data.length === 0) throw new Error("CSV is empty.");

            const assetsToUpsert = data.map((row: any, idx: number) => {
                const ticker = (row.SYMBOL || row.symbol || row.ticker || row.Ticker || row.Symbol || row.FinInstrmId || row.SC_CODE || "").trim();
                const isin = (row['ISIN NUMBER'] || row.isin || row.ISIN || row.ISIN_CODE || "").trim();
                const stock_name = (row['NAME OF COMPANY'] || row.FinInstrmNm || row.SC_NAME || row.stock_name || row.Name || row.name || "").trim();

                if (!ticker || !isin || !stock_name) {
                    throw new Error(`Invalid data at row ${idx + 2}. Required: SYMBOL/Ticker, ISIN NUMBER/isin, NAME OF COMPANY/Name`);
                }

                return {
                    ticker,
                    isin,
                    stock_name,
                    current_price: parseFloat(row.current_price || "0"),
                    last_updated: new Date().toISOString()
                };
            });

            const result = await bulkAssetUpdateAction(assetsToUpsert);
            if (result.success) {
                setSuccessCount(assetsToUpsert.length);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
            setIsLoading(false);
        }
    }

    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors min-h-[250px] flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <UploadCloud size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bulk Update ISIN+Ticker</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Correct or update asset mappings across the entire system.</p>
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
                    <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">Required: SYMBOL, ISIN NUMBER, NAME OF COMPANY (BSE/NSE Format)</p>
                </div>

                {loading && <p className="text-xs text-indigo-600 dark:text-indigo-400 animate-pulse text-center">Processing updates...</p>}

                {successCount !== null && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm transition-colors">
                        <CheckCircle2 size={18} />
                        <span>Successfully updated {successCount} assets.</span>
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
