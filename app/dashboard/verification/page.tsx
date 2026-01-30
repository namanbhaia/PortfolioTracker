"use client"

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, CheckCircle, AlertTriangle, FileCheck } from 'lucide-react';

// Types for our data structures
interface CsvRow {
    dp_id: string;
    client_name: string; // From CSV (might differ)
    ticker: string;
    isin: string;
    stock_name: string;
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
    
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]); // DB Clients
    const [verificationResults, setVerificationResults] = useState<Record<string, VerificationResult>>({});
    const [selectedClientKey, setSelectedClientKey] = useState<string>("");

    // 1. Handle File Upload & Processing
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        
        try {
            // A. Fetch current DB Data (Clients & Holdings)
            const { data: dbHoldings, error: holdingsError } = await supabase
                .from('user_holdings')
                .select('client_name, trading_id, ticker, isin, stock_name, balance_qty');
            
            const { data: dbClients, error: clientsError } = await supabase
                .from('clients')
                .select('client_name, trading_id, last_verified');

            if (holdingsError || clientsError) throw new Error("Failed to fetch database records.");

            setClients(dbClients || []);

            // B. Parse CSV (Simple browser-based parsing)
            const text = await file.text();
            const rows = text.split('\n').map(row => row.split(','));
            
            // Assumption: CSV Headers are row 0. 
            // Mapping indices based on: dp_id, client_name, share Ticker, share ISIN, share Name, Balance
            // Adjust indices based on actual CSV format.
            const parsedData: CsvRow[] = rows.slice(1).map(r => ({
                dp_id: r[0]?.trim(),
                client_name: r[1]?.trim(),
                ticker: r[2]?.trim(),
                isin: r[3]?.trim(),
                stock_name: r[4]?.trim(),
                balance: parseFloat(r[5]?.trim() || "0")
            })).filter(r => r.dp_id && r.isin); // Filter empty rows

            // C. Perform Verification Logic
            const results: Record<string, VerificationResult> = {};

            // Group CSV Data by DP ID (Trading ID)
            const csvMap = new Map<string, CsvRow[]>();
            parsedData.forEach(row => {
                if (!csvMap.has(row.dp_id)) csvMap.set(row.dp_id, []);
                csvMap.get(row.dp_id)?.push(row);
            });

            // Iterate through known DB clients to check against CSV
            for (const client of dbClients || []) {
                const tradingId = client.trading_id;
                const clientName = client.client_name;
                
                // If this client isn't in the CSV, skip
                if (!csvMap.has(tradingId)) continue;

                const clientCsvRows = csvMap.get(tradingId) || [];
                
                // Aggregate CSV Holdings for this client (Key: ISIN)
                const csvHoldings = new Map<string, number>();
                clientCsvRows.forEach(r => {
                    const current = csvHoldings.get(r.isin) || 0;
                    csvHoldings.set(r.isin, current + r.balance);
                });

                // Aggregate DB Holdings for this client (Key: ISIN)
                const clientDbRows = dbHoldings?.filter(h => h.trading_id === tradingId) || [];
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

                allIsins.forEach(isin => {
                    const csvQty = csvHoldings.get(isin) || 0;
                    const dbEntry = dbMap.get(isin);
                    const dbQty = dbEntry?.qty || 0;

                    // If mismatch found
                    if (Math.abs(csvQty - dbQty) > 0.001) {
                        // Find metadata from either source
                        const csvMeta = clientCsvRows.find(r => r.isin === isin);
                        
                        discrepancies.push({
                            client_name: clientName,
                            dp_id: tradingId,
                            isin: isin,
                            stock_name: dbEntry?.name || csvMeta?.stock_name || "Unknown",
                            ticker: dbEntry?.ticker || csvMeta?.ticker || "Unknown",
                            dp_balance: csvQty,
                            web_balance: dbQty,
                            difference: dbQty - csvQty // Website - DP
                        });
                    }
                });

                if (discrepancies.length === 0) {
                    // Perfect Match! Update Last Verified in DB immediately
                    await supabase
                        .from('clients')
                        .update({ last_verified: new Date().toISOString() })
                        .eq('trading_id', tradingId);
                    
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
            
            setVerificationResults(results);

        } catch (err: any) {
            console.error(err);
            alert("Error processing file: " + err.message);
        } finally {
            setLoading(false);
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
        </div>
    );
}