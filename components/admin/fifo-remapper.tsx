"use client"

import React, { useState } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { remapAllLedgersAction } from '@/lib/actions/admin/admin-bulk-ops';
import { useLoading } from '@/components/helper/loading-context';

export default function FifoRemapper() {
    const { setIsLoading } = useLoading();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors min-h-[250px] flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                        <RefreshCw size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Reprocess Ledger FIFO</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Remaps historical sales to align with global Same-Day vs FIFO execution logic.</p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 mb-4 px-4 text-center">
                    <button
                        disabled={loading || success}
                        onClick={async () => {
                            if (window.confirm("Are you sure you want to remap ALL historical sales? This is a heavy operation and irreversible.")) {
                                setLoading(true);
                                setIsLoading(true);
                                setSuccess(false);
                                try {
                                    await remapAllLedgersAction();
                                    setSuccess(true);
                                } catch (err: any) {
                                    alert(`Ledger Reprocessing Failed: ${err.message}`);
                                } finally {
                                    setLoading(false);
                                    setIsLoading(false);
                                }
                            }
                        }}
                        className="px-6 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full font-bold text-sm border-0 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all disabled:opacity-50"
                    >
                        {loading ? "Reprocessing..." : "Remap All Transactions"}
                    </button>
                    <p className="mt-4 text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">High resource utilization</p>
                </div>
            </div>

            <div className="mt-auto">
                {success && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-lg flex items-center gap-3 text-emerald-700 dark:text-emerald-400 text-sm transition-colors animate-in fade-in">
                        <CheckCircle2 size={18} />
                        <span>Successfully remapped global ledger.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
