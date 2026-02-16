"use client"

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, CheckCircle, AlertTriangle, FileCheck } from 'lucide-react';
import { getTickerDetailsFromYahoo } from '@/lib/actions/find-ticker';

// Types for our data structures
interface CsvRow {
    dp_id: string;
    client_name: string;
    ticker: string;
    isin: string;
    stock_name: string;
    holding_type: 'PLEDGE' | 'BENEFICIARY' | string;
    balance: number;
}

interface VerificationResult {
    status: 'MATCH' | 'MISMATCH' | 'NOT_FOUND';
    db_client_name: string;
    last_verified?: string;
    discrepancies: DiscrepancyRow[];
}

interface DiscrepancyRow {
    client_name: string;
    dp_id: string;
    isin: string;
    stock_name: string;
    ticker: string;
    dp_balance: number;
    web_balance: number;
    difference: number;
}

export default function VerificationPage() {
    const supabase = createClient();
    const [isSyncingAssets, setIsSyncingAssets] = useState(false);

    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]); // DB Clients
    const [verificationResults, setVerificationResults] = useState<Record<string, VerificationResult>>({});
    const [selectedClientKey, setSelectedClientKey] = useState<string>("");

    // 1. Define a state variable at the top of your component to hold pending assets
    const [pendingAssets, setPendingAssets] = useState<any[]>([]);

    // 2. The updated function to process and store assets in an array

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

    // Helper function for the background sync
    const performBulkSync = async (data: any[]) => {
        if (!data || data.length === 0) return;

        const { error } = await supabase
            .from('assets')
            .upsert(data, {
                onConflict: 'isin',
                ignoreDuplicates: false // Set to false so we update the PRICE if the asset exists
            });

        if (error) {
            console.error("Database Sync Error:", error.message);
        } else {
            console.log(`✅ Database Updated: ${data.length} assets synced via ISIN.`);
        }
    };



    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);

        try {
            // A. Fetch current DB Data (Clients & Holdings)
            const { data: dbHoldings, error: holdingsError } = await supabase
                .from('client_holdings')
                .select('client_name, dp_id, trading_id, ticker, isin, stock_name, balance_qty');

            const { data: dbClients, error: clientsError } = await supabase
                .from('clients')
                .select('client_name, dp_id, trading_id, last_verified');

            if (holdingsError || clientsError) throw new Error("Failed to fetch database records.");

            setClients(dbClients || []);

            // B. Parse CSV (Specialized for your non-uniform report)
            const text = await file.text();
            const lines = text.split(/\r?\n/);

            const parsedData: CsvRow[] = [];
            let currentClientId = "";

            // Regex: 2 letters followed by 10 alphanumeric characters (ISIN)
            const isinRegex = /^[A-Z]{2}[A-Z0-9]{10}/;

            lines.forEach((line) => {
                const trimmed = line.trim();

                // 1. Detect Client ID row
                if (trimmed.includes('Client Id.')) {
                    const idMatch = trimmed.match(/Client Id\.\s*([\w\d]+)/);
                    if (idMatch) currentClientId = idMatch[1];
                    return;
                }

                // 2. Detect ISIN Row (The actual data)
                if (isinRegex.test(trimmed)) {
                    const cols = trimmed.split(',').map(c => c.trim());

                    /* Updated indices based on user request:
                    cols[0] = ISIN
                    cols[1] = Stock Name
                    cols[2] = Holding Type ("PLEDGE" or "BENEFICIARY")
                    cols[3] = Balance Qty
                    */
                    if (cols.length >= 4) {
                        const rawName = cols[1] || "Unknown Stock";
                        parsedData.push({
                            dp_id: currentClientId,
                            client_name: "",
                            ticker: rawName,
                            isin: cols[0],
                            stock_name: rawName,
                            holding_type: cols[2].toUpperCase(),
                            balance: parseFloat(cols[3].replace(/,/g, '')) || 0
                        });
                    }
                }
            });

            // filter out rows where we didn't have a Client ID context
            const cleanParsedData = parsedData.filter(r => r.dp_id !== "");

            // C. Perform Verification Logic
            const results: Record<string, VerificationResult> = {};

            // Group CSV Data by DP ID (Trading ID)
            const csvMap = new Map<string, CsvRow[]>();
            cleanParsedData.forEach(row => {
                if (!csvMap.has(row.dp_id)) csvMap.set(row.dp_id, []);
                csvMap.get(row.dp_id)?.push(row);
            });

            // 1. Create a master list of all discrepancies and pledge updates across all clients
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

                // Aggregate CSV Holdings for this client (Key: ISIN)
                // Stores total balance and specific pledged amount
                const csvHoldings = new Map<string, { total: number, pledged: number }>();
                clientCsvRows.forEach(r => {
                    const existing = csvHoldings.get(r.isin) || { total: 0, pledged: 0 };
                    existing.total += r.balance;
                    if (r.holding_type === "PLEDGE") {
                        existing.pledged += r.balance;
                    }
                    csvHoldings.set(r.isin, existing);
                });

                // Aggregate DB Holdings for this client (Key: ISIN)
                const clientDbRows = dbHoldings?.filter(h => h.dp_id === dp_id) || [];
                const dbMap = new Map<string, { qty: number, ticker: string, name: string }>();

                clientDbRows.forEach(r => {
                    const current = dbMap.get(r.isin)?.qty || 0;
                    dbMap.set(r.isin, {
                        qty: current + r.balance_qty,
                        ticker: r.ticker,
                        name: r.stock_name
                    });
                });

                // Compare
                const discrepancies: DiscrepancyRow[] = [];
                const allIsins = new Set([...Array.from(csvHoldings.keys()), ...Array.from(dbMap.keys())]);

                for (const isin of Array.from(allIsins)) {
                    const csvData = csvHoldings.get(isin) || { total: 0, pledged: 0 };
                    const csvQty = csvData.total;
                    const dbEntry = dbMap.get(isin);
                    const dbQty = dbEntry?.qty || 0;

                    const match = Math.abs(csvQty - dbQty) < 0.001;

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
                            dp_balance: csvQty,
                            web_balance: dbQty,
                            difference: dbQty - csvQty
                        });
                    }
                }

                discrepancies.forEach(d => allDiscrepancies.push(d));

                if (discrepancies.length === 0) {
                    // Perfect Match! Update Last Verified in DB immediately
                    await supabase
                        .from('clients')
                        .update({ last_verified: new Date().toISOString() })
                        .eq('dp_id', dp_id);

                    results[clientName] = {
                        status: 'MATCH',
                        db_client_name: clientName,
                        discrepancies: []
                    };
                } else {
                    results[clientName] = {
                        status: 'MISMATCH',
                        db_client_name: clientName,
                        discrepancies
                    };
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

                            {/* CASE 1: MATCH */}
                            {selectedResult.status === 'MATCH' && (
                                <div className="p-12 flex flex-col items-center text-center gap-4 text-emerald-600">
                                    <CheckCircle size={64} />
                                    <h2 className="text-2xl font-bold text-slate-900">All Clear!</h2>
                                    <p className="text-slate-600 max-w-md">
                                        Holdings match perfectly between Website and DP Manager.
                                        <br />
                                        Timestamp updated successfully.
                                    </p>
                                </div>
                            )}

                            {/* CASE 2: MISMATCH */}
                            {selectedResult.status === 'MISMATCH' && (
                                <div>
                                    <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center gap-3 text-rose-700">
                                        <AlertTriangle size={20} />
                                        <span className="font-bold">Discrepancies Found</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-3">Client / DP ID</th>
                                                    <th className="px-6 py-3">Asset</th>
                                                    <th className="px-6 py-3 text-right">DP Balance</th>
                                                    <th className="px-6 py-3 text-right">Web Balance</th>
                                                    <th className="px-6 py-3 text-right">Diff</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {selectedResult.discrepancies.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50">
                                                        <td className="px-6 py-3">
                                                            <div className="font-bold text-slate-900">{row.client_name}</div>
                                                            <div className="text-[10px] text-slate-400 font-mono">{row.dp_id}</div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="font-bold">{row.ticker}</div>
                                                            <div className="text-[10px] text-slate-400">{row.isin}</div>
                                                        </td>
                                                        <td className="px-6 py-3 text-right font-mono text-slate-600">
                                                            {row.dp_balance}
                                                        </td>
                                                        <td className="px-6 py-3 text-right font-mono text-slate-600">
                                                            {row.web_balance}
                                                        </td>
                                                        <td className="px-6 py-3 text-right font-bold text-rose-600">
                                                            {row.difference > 0 ? "+" : ""}{row.difference}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
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
