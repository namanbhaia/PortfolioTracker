"use client"


import React, { useState } from 'react';
import { importExchangeTradesAction } from '@/lib/actions/admin/import-exchange';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Play, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';


export function DailyLoggingClient() {
    const [file, setFile] = useState<File | null>(null);
    const [dryRun, setDryRun] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Non-persistent report state (Rendered inline below upload area)
    const [report, setReport] = useState<any | null>(null);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setErrorMessage(null);
        }
    };


    const handleImport = async () => {
        if (!file) return;
        setLoading(true);
        setErrorMessage(null);
        setReport(null);


        const formData = new FormData();
        formData.append('file', file);


        const result = await importExchangeTradesAction(formData, dryRun);


        if (result.error) {
            setErrorMessage(result.error);
            setLoading(false);
            return;
        }


        setReport(result.report);
        setFile(null);
        setLoading(false);
    };


    return (
        <div className="space-y-6">
            {/* A. Upload Widget Card */}
            <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase">Upload Daily Trade File</h2>
                    {/* Dry Run Toggle */}
                    <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={dryRun}
                            onChange={(e) => setDryRun(e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Dry Run Mode (Preview Only)</span>
                    </label>
                </div>


                <div className="flex items-center gap-4">
                    <input
                        type="file"
                        accept=".csv,.gz"
                        onChange={handleFileChange}
                        id="exchange-file-input"
                        className="hidden"
                    />
                    <label
                        htmlFor="exchange-file-input"
                        className="flex-1 p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-all bg-slate-50 dark:bg-slate-950"
                    >
                        <FileSpreadsheet size={32} className="text-slate-400 dark:text-slate-600 mb-2" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {file ? file.name : "Drag & drop or click to select .csv or .csv.gz file"}
                        </span>
                    </label>


                    <Button
                        disabled={!file || loading}
                        onClick={handleImport}
                        className="h-full px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl flex items-center gap-2 text-xs font-bold"
                    >
                        <Play size={16} />
                        {loading ? "Processing..." : dryRun ? "Run Preview" : "Process Log"}
                    </Button>
                </div>


                {errorMessage && (
                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/30 rounded-xl flex items-start gap-2.5 text-rose-600 dark:text-rose-400 text-xs">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                    </div>
                )}
            </div>


            {/* B. INLINE TRANSACTION SUMMARY REPORT */}
            {report ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Summary Stats Panel */}
                    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="text-emerald-500" size={18} />
                                <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase">
                                    {report.dryRun ? "Dry Run Preview Results" : "Ingestion Execution Report"}
                                </h2>
                            </div>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2.5 py-1 rounded-full">
                                Trade Date: {report.tradeDate}
                            </span>
                        </div>


                        {report.dryRun && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-955/25 border border-amber-100 dark:border-amber-950/30 rounded-xl flex items-center gap-2 text-amber-800 dark:text-amber-300 text-xs">
                                <Info size={16} className="shrink-0" />
                                <span><strong>Preview Mode Active:</strong> These transactions are simulated and have **not** been saved to the database.</span>
                            </div>
                        )}


                        <div className="grid grid-cols-3 gap-4 font-bold text-xs">
                            <div className="p-4 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-900 flex items-center justify-between">
                                <div>
                                    <span className="text-slate-400 block uppercase text-[10px]">Purchases</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">+{report.purchasesCount} Lots</span>
                                </div>
                                <ArrowUpRight className="text-emerald-500" size={24} />
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-900 flex items-center justify-between">
                                <div>
                                    <span className="text-slate-400 block uppercase text-[10px]">Sales splits</span>
                                    <span className="text-rose-600 dark:text-rose-400 text-sm mt-0.5 block">+{report.salesCount} splits</span>
                                </div>
                                <ArrowDownRight className="text-rose-500" size={24} />
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-900 flex items-center justify-between">
                                <div>
                                    <span className="text-slate-400 block uppercase text-[10px]">Skipped Rows</span>
                                    <span className="text-slate-500 text-sm mt-0.5 block">{report.skippedCount} Trades</span>
                                </div>
                                <Info className="text-slate-400" size={20} />
                            </div>
                        </div>


                        {report.skippedReport.length > 0 && (
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-955 rounded-xl border border-slate-100 dark:border-slate-900 space-y-2">
                                <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px]">Skipped Warnings & Logs</h4>
                                <div className="max-h-24 overflow-y-auto space-y-1 text-slate-400 font-mono text-[10px]">
                                    {report.skippedReport.map((w: string, idx: number) => <div key={idx}>{w}</div>)}
                                </div>
                            </div>
                        )}
                    </div>


                    {/* Side-by-Side Transaction Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Purchases Table */}
                        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Imported Purchases (Buys)</h3>
                            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-55 dark:bg-slate-955 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                                            <th className="p-3">Client</th>
                                            <th className="p-3">Ticker</th>
                                            <th className="p-3">Qty</th>
                                            <th className="p-3">Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-slate-600 dark:text-slate-300">
                                        {report.purchases.map((p: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/30">
                                                <td className="p-3">{p.client_name}</td>
                                                <td className="p-3 font-bold text-slate-800 dark:text-white">{p.ticker}</td>
                                                <td className="p-3 font-mono">{p.qty.toLocaleString()}</td>
                                                <td className="p-3 font-mono">₹{p.rate.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        {report.purchases.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-6 text-center text-slate-400">
                                                    No purchases imported in this run.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>


                        {/* Sales Table */}
                        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
                            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Imported Sales (Sells)</h3>
                            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-55 dark:bg-slate-955 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                                            <th className="p-3">Client</th>
                                            <th className="p-3">Ticker</th>
                                            <th className="p-3">Qty</th>
                                            <th className="p-3">Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-slate-600 dark:text-slate-300">
                                        {report.sales.map((s: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/30">
                                                <td className="p-3">{s.client_name}</td>
                                                <td className="p-3 font-bold text-slate-800 dark:text-white">{s.ticker}</td>
                                                <td className="p-3 font-mono">{s.qty.toLocaleString()}</td>
                                                <td className="p-3 font-mono">₹{s.rate.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                        {report.sales.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="p-6 text-center text-slate-400">
                                                    No sales imported in this run.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Empty State Card */
                <div className="p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center space-y-3">
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-600 rounded-2xl border border-slate-100 dark:border-slate-900">
                        <FileSpreadsheet size={28} />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">No file processed</h3>
                        <p className="text-[10px] text-slate-400 max-w-sm">
                            Upload a gzipped (.gz) or raw CSV daily trade execution file above to calculate FIFO and inspect the transaction results inline.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
