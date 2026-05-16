"use client"

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { runBseToNseMigrationAction } from '@/lib/actions/admin/admin-bulk-ops';
import { useLoading } from '@/components/helper/loading-context';

export default function BseToNseMigration() {
    const { setIsLoading } = useLoading();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleMigration() {
        if (!window.confirm("Are you sure you want to run the BSE to NSE migration? This will update all eligible holdings.")) {
            return;
        }

        setLoading(true);
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const result = await runBseToNseMigrationAction();
            if (result.success) {
                setSuccess(true);
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
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors min-h-[250px] flex flex-col justify-between">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <RefreshCw size={24} className={loading ? "animate-spin" : ""} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">BSE to NSE Migration</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Standardize tickers across holding reports</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900">
                    <button
                        onClick={handleMigration}
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full font-bold text-sm border-0 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all disabled:opacity-50"
                    >
                        {loading ? "Processing..." : "Run Migration"}
                    </button>
                    <p className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 text-center px-4 tracking-[0.05em]">
                        Updates numeric BSE tickers to NSE symbols via ISIN mapping
                    </p>
                </div>

                {success && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm transition-colors">
                        <CheckCircle2 size={18} />
                        <span>Migration completed successfully.</span>
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
