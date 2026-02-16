"use client"

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, FileCheck } from 'lucide-react';
import { getTickerDetailsFromYahoo } from '@/lib/actions/find-ticker';
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
    const [isSyncingAssets, setIsSyncingAssets] = useState(false);

    const [loading, setLoading] = useState(false);
    const [verificationResults, setVerificationResults] = useState<Record<string, VerificationResult>>({});
    const [selectedClientKey, setSelectedClientKey] = useState<string>("");

    const handleMissingAssetsBatch = async (discrepancies: DiscrepancyRow[]) => {
        // 1. Get unique ISINs only
        const uniqueMissing = discrepancies.filter((v, i, a) =>
            v.web_balance === 0 && a.findIndex(t => t.isin === v.isin) === i
        );

        if (uniqueMissing.length === 0) return [];

        const assetsToSync: any[] = [];
        const chunkSize = 5; // Process in small batches of 5 to prevent API lag

        for (let i = 0; i < uniqueMissing.length; i += chunkSize) {
            const chunk = uniqueMissing.slice(i, i + chunkSize);
            const chunkResults = await Promise.all(chunk.map(async (item) => {
                try {
                    // Try ISIN only first (faster/more accurate). Fallback to name ONLY if ISIN fails.
                    const details = await getTickerDetailsFromYahoo(item.isin);
                    const finalDetails = details || await getTickerDetailsFromYahoo(item.stock_name);

                    if (finalDetails?.symbol) {
                        return {
                            ticker: (finalDetails.symbol as any).split('.')[0].toUpperCase(),
                            stock_name: item.stock_name,
                            isin: item.isin,
                            current_price: finalDetails.price || 0,
                            last_updated: new Date().toISOString()
                        };
                    }
                } catch (err) {
                    console.warn(`Speed skip: Could not fetch ${item.isin}`);
                }
                return null;
            }));

            assetsToSync.push(...chunkResults.filter(Boolean));

            // Brief pause between chunks (200ms) to let the event loop breathe
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        return assetsToSync;
    };

    const performBulkSync = async (data: any[]) => {
        if (!data || data.length === 0) return;
        const { error } = await supabase.from('assets').upsert(data, { onConflict: 'isin' });
        if (error) console.error("Database Sync Error:", error.message);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);

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

                        // // If it's missing from DB, sync it to the assets table
                        // if (!dbEntry && csvMeta) {
                        //     handleMissingAsset(csvMeta.isin, csvMeta.stock_name);
                        // }

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

            // 1. Render the table IMMEDIATELY so the user sees something
            setVerificationResults(results);
            setLoading(false); // Stop the main loading spinner

            // 2. Start the background sync for MISSING assets only
            const missingAssets = allDiscrepancies.filter(d => d.web_balance === 0);
            if (missingAssets.length > 0) {
                setIsSyncingAssets(true); // START background sync UI

                try {
                    const assetsToSync = await handleMissingAssetsBatch(missingAssets);
                    if (assetsToSync.length > 0) {
                        await performBulkSync(assetsToSync);
                        setVerificationResults(prev => {
                            const updated = { ...prev };
                            assetsToSync.forEach(s => {
                                Object.values(updated).forEach(res => {
                                    res.discrepancies.forEach(d => {
                                        if (d.isin === s.isin) d.ticker = s.ticker;
                                    });
                                });
                            });
                            return updated;
                        });
                    }
                } finally {
                    setIsSyncingAssets(false); // STOP background sync UI
                }
            }
        } catch (err: any) {
            setLoading(false);
            alert(err.message);
        }
    };

    const selectedResult = verificationResults[selectedClientKey];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <FileCheck className="text-indigo-600" size={32} />
                    Holdings Verification
                </h1>
                <p className="text-slate-500 mt-2">
                    Upload DP-Manager export (CSV) to validate system accuracy.
                </p>
            </header>

            {/* Upload Section */}
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center gap-4 text-center">
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-full">
                    <UploadCloud size={32} />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Upload Holdings CSV</h3>
                    <p className="text-sm text-slate-400">Expected columns: dp_id, client_name, ticker, isin, name, balance</p>
                </div>
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="block w-full max-w-xs text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100
                    "
                />
                {loading && <p className="text-sm text-indigo-600 animate-pulse">Processing & Verifying...</p>}
            </div>

            {/* Results Selection */}
            {Object.keys(verificationResults).length > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4">
                        <label className="font-bold text-slate-700">View Results For:</label>
                        <select
                            className="p-2.5 bg-white border border-slate-200 rounded-lg min-w-[250px]"
                            value={selectedClientKey}
                            onChange={(e) => setSelectedClientKey(e.target.value)}
                        >
                            <option value="">-- Select Client --</option>
                            {Object.keys(verificationResults).map(client => (
                                <option key={client} value={client}>
                                    {client} ({verificationResults[client].status})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Result Display Logic */}
                    {selectedResult && (
                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <VerificationDisplay selectedResult={selectedResult} />
                        </div>
                    )}
                </div>
            )}
            {isSyncingAssets && (
                <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-white border border-indigo-100 shadow-xl p-4 rounded-2xl animate-in slide-in-from-right-8">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">Syncing Market Data</span>
                        <span className="text-[11px] text-slate-500">Fetching tickers & live prices...</span>
                    </div>
                </div>
            )}
        </div>
    );
}
