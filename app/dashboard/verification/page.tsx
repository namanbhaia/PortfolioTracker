"use client"

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, FileCheck, Download } from 'lucide-react';
import {
    CsvRow,
    VerificationResult,
    DiscrepancyRow,
    parseVerificationCsv,
    groupCsvByDpId,
    aggregateCsvHoldings
} from '@/components/helper/verification-utils';
import { VerificationDisplay } from '@/components/dashboard/verification-display';
import { revalidateDashboard } from '@/lib/actions/admin/cache-revalidate';

export default function VerificationPage() {
    const supabase = createClient();
    const [viewState, setViewState] = useState({
        loading: false,
        verificationResults: {} as Record<string, VerificationResult>
    });
    const [selectedClientKey, setSelectedClientKey] = useState<string>("");
    const [fileKey, setFileKey] = useState(Date.now());

    const handleReset = () => {
        setSelectedClientKey("");
        setFileKey(Date.now());
    };
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setViewState(prev => ({ ...prev, loading: true }));

        try {
            const [holdingsRes, clientsRes] = await Promise.all([
                supabase.from('client_holdings').select('client_name, dp_id, trading_id, ticker, isin, stock_name, balance_qty'),
                supabase.from('clients').select('client_name, dp_id, trading_id, last_verified')
            ]);

            if (holdingsRes.error || clientsRes.error) throw new Error("Failed to fetch database records.");

            const dbHoldings = holdingsRes.data || [];
            const dbClients = clientsRes.data || [];

            const text = await file.text();
            const cleanParsedData = parseVerificationCsv(text);
            const csvMap = groupCsvByDpId(cleanParsedData);

            const results: Record<string, VerificationResult> = {};
            const allDiscrepancies: DiscrepancyRow[] = [];
            const pledgeUpdates: any[] = [];

            // Iterate through known DB clients to check against CSV
            for (const client of dbClients || []) {
                const dp_id = client.dp_id;
                const clientName = client.client_name;

                // If this client isn't in the CSV, skip
                // if (!csvMap.has(tradingId)) continue;
                if (!csvMap.has(dp_id)) continue;

                const clientCsvRows = csvMap.get(dp_id) || [];
                const csvHoldingsMap = aggregateCsvHoldings(clientCsvRows);

                const clientDbRows = dbHoldings.filter(h => h.dp_id === dp_id);
                const dbMap = new Map<string, { qty: number, ticker: string, name: string }>();

                clientDbRows.forEach(r => {
                    const current = dbMap.get(r.isin)?.qty || 0;
                    dbMap.set(r.isin, {
                        qty: current + r.balance_qty,
                        ticker: r.ticker,
                        name: r.stock_name
                    });
                });

                const discrepancies: DiscrepancyRow[] = [];
                const allIsins = new Set([...Array.from(csvHoldingsMap.keys()), ...Array.from(dbMap.keys())]);

                for (const isin of Array.from(allIsins)) {
                    const csvData = csvHoldingsMap.get(isin) || { total: 0, pledged: 0 };
                    const dbEntry = dbMap.get(isin);
                    const dbQty = dbEntry?.qty || 0;
                    const match = Math.abs(csvData.total - dbQty) < 0.001;

                    // COLLECT PLEDGE UPDATES if balance matches
                    if (match && dbQty > 0 && dbEntry?.ticker) {
                        pledgeUpdates.push({
                            client_name: clientName,
                            ticker: dbEntry.ticker,
                            pledged_qty: csvData.pledged
                        });
                    }

                    if (!match) {
                        const csvMeta = clientCsvRows.find(r => r.isin === isin);

                        discrepancies.push({
                            client_name: clientName,
                            dp_id: dp_id,
                            isin: isin,
                            stock_name: dbEntry?.name || csvMeta?.stock_name || "New Asset",
                            ticker: dbEntry?.ticker || csvMeta?.stock_name || "NEW",
                            dp_balance: csvData.total,
                            web_balance: dbQty,
                            difference: dbQty - csvData.total
                        });
                    }
                }

                discrepancies.forEach(d => allDiscrepancies.push(d));

                if (discrepancies.length === 0) {
                    const newDate = new Date().toISOString();
                    await supabase.from('clients').update({ last_verified: newDate }).eq('dp_id', dp_id);
                    results[clientName] = { 
                        status: 'MATCH', 
                        db_client_name: clientName, 
                        discrepancies: [],
                        last_verified: newDate
                    };
                } else {
                    results[clientName] = { 
                        status: 'MISMATCH', 
                        db_client_name: clientName, 
                        discrepancies,
                        last_verified: client.last_verified
                    };
                }
            }

            // BATCH UPDATE PLEDGES (Single Upsert + Single Cleanup Delete)
            if (pledgeUpdates.length > 0) {
                await supabase.from('pledges').upsert(pledgeUpdates, { onConflict: 'client_name, ticker' });
                await supabase.from('pledges').delete().eq('pledged_qty', 0);
            }

            // Grouping these updates to prevent multiple flickers
            const missingAssets = allDiscrepancies.filter(d => d.web_balance === 0);
            setViewState(prev => ({
                ...prev,
                loading: false,
                verificationResults: results,
            }));


            // Trigger revalidation if any client was processed
            if (Object.keys(results).length > 0) {
                await revalidateDashboard();
            }
        } catch (err: any) {
            setViewState(prev => ({ ...prev, loading: false }));
            alert(err.message);
        }
    };

    const selectedResult = viewState.verificationResults[selectedClientKey];

    const handleExportDiscrepancies = () => {
        const results = viewState.verificationResults;
        const allDiscrepancies: DiscrepancyRow[] = [];

        Object.values(results).forEach(res => {
            res.discrepancies.forEach(d => allDiscrepancies.push(d));
        });

        if (allDiscrepancies.length === 0) {
            alert("No discrepancies found to export.");
            return;
        }

        const headers = ["Client Name", "DP ID", "ISIN", "Ticker", "Stock Name", "DP Balance", "Web Balance", "Difference"];
        const csvRows = [
            headers.join(','),
            ...allDiscrepancies.map(row => [
                `"${row.client_name}"`,
                `"${row.dp_id}"`,
                `"${row.isin}"`,
                `"${row.ticker}"`,
                `"${row.stock_name}"`,
                row.dp_balance,
                row.web_balance,
                row.difference
            ].join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `discrepancies_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto transition-colors">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors flex items-center gap-3">
                        <FileCheck className="text-indigo-600 dark:text-indigo-400" size={28} />
                        Holdings Verification
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                        Upload DP-Manager export (CSV) to validate system accuracy.
                    </p>
                </div>
            </header>

            {/* Upload Section */}
            <div className="bg-white dark:bg-slate-900/50 p-8 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center gap-4 text-center transition-colors">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full transition-colors">
                    <UploadCloud size={32} />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Upload Holdings CSV</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500">Expected columns: dp_id, client_name, ticker, isin, name, balance</p>
                </div>
                <input
                    key={fileKey}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="block w-full max-w-xs text-sm text-slate-500 dark:text-slate-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-400
                        hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/70 transition-all
                    "
                />
                {Object.keys(viewState.verificationResults).length > 0 && (
                    <button
                        onClick={handleReset}
                        className="mt-2 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 underline transition-colors"
                    >
                        Remove Upload / Start Over
                    </button>
                )}
                {viewState.loading && <p className="text-sm text-indigo-600 animate-pulse">Processing & Verifying...</p>}
            </div>

            {/* Results Selection */}
            {Object.keys(viewState.verificationResults).length > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4">
                        <label className="font-bold text-slate-700 dark:text-slate-300 transition-colors">View Results For:</label>
                        <select
                            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg min-w-[250px] dark:text-white transition-colors"
                            value={selectedClientKey}
                            onChange={(e) => setSelectedClientKey(e.target.value)}
                        >
                            <option value="">-- Select Client --</option>
                            {Object.keys(viewState.verificationResults).map(client => (
                                <option key={client} value={client}>
                                    {client} ({viewState.verificationResults[client].status})
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleExportDiscrepancies}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all border border-indigo-100 dark:border-indigo-800"
                        >
                            <Download size={18} />
                            Export Discrepancies
                        </button>
                    </div>

                    {/* Result Display Logic */}
                    {selectedResult && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-colors">
                            <VerificationDisplay selectedResult={selectedResult} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
