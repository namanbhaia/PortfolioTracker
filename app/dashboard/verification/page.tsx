"use client"

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, FileCheck, Download } from 'lucide-react';
import { getTickerDetailsFromYahoo } from '@/lib/actions/yahoo/find-ticker';
import {
    CsvRow,
    VerificationResult,
    DiscrepancyRow,
    parseVerificationCsv,
    groupCsvByDpId,
    aggregateCsvHoldings
} from '@/components/helper/verification-utils';
import { VerificationDisplay } from '@/components/dashboard/verification-display';

export default function VerificationPage() {
    const supabase = createClient();
    const [viewState, setViewState] = useState({
        loading: false,
        isSyncingAssets: false,
        verificationResults: {} as Record<string, VerificationResult>
    });
    const [selectedClientKey, setSelectedClientKey] = useState<string>("");
    const [fileKey, setFileKey] = useState(Date.now());

    const handleReset = () => {
        setViewState({ loading: false, isSyncingAssets: false, verificationResults: {} });
        setSelectedClientKey("");
        setFileKey(Date.now());
    };

    const handleMissingAssetsBatch = async (discrepancies: DiscrepancyRow[]) => {
        const uniqueMissing = discrepancies.filter((v, i, a) =>
            v.web_balance === 0 && a.findIndex(t => t.isin === v.isin) === i
        );

        if (uniqueMissing.length === 0) return [];

        const assetsToSync: any[] = [];
        const chunkSize = 15;

        for (let i = 0; i < uniqueMissing.length; i += chunkSize) {
            const chunk = uniqueMissing.slice(i, i + chunkSize);
            const chunkIsins = chunk.map(item => item.isin);

            try {
                // SINGLE server call for the entire chunk
                const bulkResults = await getTickerDetailsFromYahoo(chunkIsins);

                if (bulkResults) {
                    bulkResults.forEach(res => {
                        const originalItem = chunk.find(c => c.isin === res.isin);
                        assetsToSync.push({
                            ticker: res.symbol.split('.')[0].toUpperCase(),
                            stock_name: originalItem?.stock_name || res.symbol,
                            isin: res.isin,
                            current_price: res.price,
                            last_updated: new Date().toISOString()
                        });
                    });
                }
            } catch (err) {
                console.error("Bulk sync chunk failed:", err);
            }

            // Keep the small pause to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        return assetsToSync;
    };

    const performBulkSync = async (data: any[]) => {
        if (!data || data.length === 0) return;
        const { error } = await supabase.from('assets').upsert(data, { onConflict: 'ticker' });
        if (error) console.error("Database Sync Error:", error.message);
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
                    await supabase.from('clients').update({ last_verified: new Date().toISOString() }).eq('dp_id', dp_id);
                    results[clientName] = { status: 'MATCH', db_client_name: clientName, discrepancies: [] };
                } else {
                    results[clientName] = { status: 'MISMATCH', db_client_name: clientName, discrepancies };
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
                isSyncingAssets: false // missingAssets.length > 0
            }));

            /* Commenting out Yahoo Finance Sync for now 
            if (missingAssets.length > 0) {
                try {
                    // 1. Get the list of ISINs you are curious about
                    const missingIsins = missingAssets.map(d => d.isin);

                    // 2. Ask Supabase: "Which of these do you already have?"
                    const { data: foundAssets } = await supabase
                        .from('assets')
                        .select('isin')
                        .in('isin', missingIsins); // Only fetches rows that match your missing list

                    const foundIsinSet = new Set(foundAssets?.map(a => a.isin) || []);

                    // 3. These are the ones truly missing from the 'assets' table
                    const trulyNewAssets = missingAssets.filter(d => !foundIsinSet.has(d.isin));
                    if (trulyNewAssets.length > 0) {
                        setViewState(prev => ({ ...prev, isSyncingAssets: true }));

                        // Call your optimized batch function for only the new ones
                        const assetsToSync = await handleMissingAssetsBatch(trulyNewAssets);

                        if (assetsToSync.length > 0) {
                            await performBulkSync(assetsToSync);
                            setViewState(prev => {
                                const updated = { ...prev.verificationResults };
                                assetsToSync.forEach(s => {
                                    Object.values(updated).forEach(res => {
                                        (res as VerificationResult).discrepancies.forEach(d => {
                                            if (d.isin === s.isin) d.ticker = s.ticker;
                                        });
                                    });
                                });
                                return { ...prev, verificationResults: updated, isSyncingAssets: false };
                            });
                        } else {
                            setViewState(prev => ({ ...prev, isSyncingAssets: false }));
                        }
                    }

                    setViewState(prev => ({ ...prev, isSyncingAssets: false }));
                } catch (e) {
                    console.error("Asset check failed:", e);
                    setViewState(prev => ({ ...prev, isSyncingAssets: false }));
                }
            }
            */
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
            {viewState.isSyncingAssets && (
                <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 shadow-xl p-4 rounded-2xl animate-in slide-in-from-right-8 transition-colors">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600 dark:bg-indigo-500"></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Syncing Market Data</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Fetching tickers & live prices...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
