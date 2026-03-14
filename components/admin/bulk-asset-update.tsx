"use client"

import React, { useState } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { bulkAssetUpdateAction } from '@/lib/actions/admin-bulk-ops';
import { parse } from 'csv-parse/browser/esm/sync';

export default function BulkAssetUpdate() {
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
        }
    }

    return (
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                    <UploadCloud size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Bulk Update ISIN+Ticker</h3>
                    <p className="text-sm text-slate-500">Correct or update asset mappings across the entire system.</p>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-300 rounded-lg bg-white">
                <input
                    type="file"
                    accept=".csv"
                    disabled={loading}
                    onChange={handleFileChange}
                    className="block w-full max-w-xs text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
                <p className="mt-2 text-[10px] text-slate-400">Required: SYMBOL, ISIN NUMBER, NAME OF COMPANY (BSE/NSE Format)</p>
            </div>

            {loading && <p className="mt-4 text-xs text-indigo-600 animate-pulse text-center">Processing updates...</p>}

            {successCount !== null && (
                <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3 text-emerald-700 text-sm">
                    <CheckCircle2 size={18} />
                    <span>Successfully updated {successCount} assets.</span>
                </div>
            )}

            {error && (
                <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg flex items-center gap-3 text-rose-700 text-sm">
                    <AlertCircle size={18} />
                    <span>Error: {error}</span>
                </div>
            )}
        </div>
    );
}
