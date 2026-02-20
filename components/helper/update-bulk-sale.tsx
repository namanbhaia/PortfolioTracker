"use client"

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UploadCloud, FileCheck } from 'lucide-react';
import { parse } from 'csv-parse/browser/esm/sync';
import { calculateProfitMetrics, getGrandfatheredRate, isLongTerm } from '@/components/helper/utility';

const formatCsvDate = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
};

export default function VerificationPage() {
    const supabase = createClient();
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("");
    const [loading, setLoading] = useState(false);

    async function runBulkSale(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            // 1. INITIAL SETUP & USER AUTH
            const { data: { user } } = await supabase.auth.getUser();
            const fileContent = await file.text();
            const salesToProcess = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });

            // 2. BULK PRE-FETCH (One-time DB hits to avoid loops)
            const [{ data: allPurchases }, { data: allClients }] = await Promise.all([
                supabase.from('purchases').select('*').gt('balance_qty', 0).order('date', { ascending: true }),
                supabase.from('clients').select('client_id, client_name')
            ]);

            // 3. FETCH UNIQUE GRANDFATHERED RATES
            const uniqueTickers = Array.from(new Set(salesToProcess.map((s: any) => s.ticker.trim())));
            const rateEntries = await Promise.all(
                uniqueTickers.map(async (ticker) => {
                    const rate = await getGrandfatheredRate(supabase, ticker);
                    return [ticker, rate];
                })
            );
            const rateMap = new Map(rateEntries);

            // 4. MAPS FOR SPEED & MEMORY STAGING
            const clientMap = new Map(allClients?.map(c => [c.client_name.trim(), c.client_id]));
            let localPurchases = [...(allPurchases || [])];

            const salesToInsert = [];
            const purchasesToUpdateMap = new Map();

            // let { data: startId } = await supabase.rpc('get_next_sale_id');
            let startId = 1;
            let currentLocalId = Number(startId);

            let rowsProcessed = 0; // Initialize counter before the loop
            const totalRows = salesToProcess.length;

            const shortfallErrors = [];

            // 5. THE FIFO ENGINE (Running entirely in RAM)
            for (const row of salesToProcess as any[]) {
                rowsProcessed++;
                currentLocalId++;
                // Update UI every 10 rows to keep it snappy without lagging React
                if (rowsProcessed % 10 === 0 || rowsProcessed === totalRows) {
                    const percent = Math.round((rowsProcessed / totalRows) * 100);
                    setProgress(percent);
                    setStatusText(`Processing row ${rowsProcessed} of ${totalRows}...`);

                    // Console log for background tracking
                    console.log(`[Batch Progress]: ${percent}%`);
                }

                const clientName = (row.client_name || row.sale_client_name || row.Client || "").trim();
                const ticker = (row.ticker || row.Symbol || row.Ticker || "").trim();

                // Flexible quantity parsing (handles sale_qty, qty, Quantity)
                const rawQty = row.sale_qty || row.qty || row.Quantity || row.Units;
                const saleQtyRequested = parseFloat(String(rawQty || 0).replace(/,/g, ''));

                // Flexible rate parsing (handles rate, price, Sale Price)
                const rawRate = row.rate || row.price || row.Rate || row.Price;
                const saleRate = parseFloat(String(rawRate || 0).replace(/,/g, ''));

                const rawDate = row.sale_date || row.date || row.Date;
                const saleDateStr = formatCsvDate(rawDate?.trim());

                // Log details for debugging if needed
                console.log(`Processing Row ${rowsProcessed}:`, { ticker, saleQtyRequested, saleRate });

                // SKIP if data is invalid
                if (!ticker || isNaN(saleQtyRequested) || isNaN(saleRate) || !clientName) {
                    console.warn(`⚠️ Skipping Row ${rowsProcessed} due to invalid data:`, row);
                    continue;
                }

                const clientId = clientMap.get(clientName);
                const cutoffPrice = rateMap.get(ticker) || 0;
                const sharedCustomId = `SALE-${currentLocalId.toString().padStart(4, '0')}`;
            
                let availableLots = localPurchases.filter(p =>
                    p.client_name?.trim().toLowerCase() === clientName.trim().toLowerCase() &&
                    p.ticker?.trim().toLowerCase() === ticker.trim().toLowerCase() &&
                    p.balance_qty > 0
                );
                let remainingQty = saleQtyRequested;

                for (let lot of availableLots) {
                    if (remainingQty <= 0) break;

                    const qtyFromThisLot = Math.min(lot.balance_qty, remainingQty);
                   
                    // Perform calculations using your helper functions
                    const { profit, adjusted_profit } = calculateProfitMetrics(
                        lot.rate, new Date(lot.date), saleRate, cutoffPrice, qtyFromThisLot
                    );

                    const saleTrxId = crypto.randomUUID(); // Generate link locally

                    salesToInsert.push({
                        trx_id: saleTrxId,
                        purchase_trx_id: lot.trx_id,
                        custom_id: sharedCustomId,
                        client_name: clientName,
                        client_id: clientId,
                        date: saleDateStr,
                        rate: saleRate,
                        sale_qty: qtyFromThisLot,
                        profit_stored: profit,
                        adjusted_profit_stored: adjusted_profit,
                        long_term: isLongTerm(new Date(lot.date), new Date(saleDateStr)),
                        user_id: user?.id
                    });

                    // 1. Calculate new balance
                    const newBalance = Number((lot.balance_qty - qtyFromThisLot).toFixed(4));

                    // 2. Update the lot object in memory (so the loop knows this lot is being used)
                    lot.balance_qty = newBalance;
                    lot.sale_ids = [...(lot.sale_ids || []), saleTrxId];

                    // 3. Store the WHOLE lot object in the Map for the Database update
                    // We use the 'lot' reference because it now contains the updated balance
                    purchasesToUpdateMap.set(lot.trx_id, { ...lot });

                    remainingQty -= qtyFromThisLot;
                }
                // 🚩 CAPTURE ERROR HERE
                if (remainingQty > 0) {
                    shortfallErrors.push({
                        client: clientName,
                        ticker: ticker,
                        requested: saleQtyRequested,
                        available: saleQtyRequested - remainingQty,
                        missing: remainingQty,
                        rowNumber: rowsProcessed + 1
                    });
                }
            }

            // 2. LOG THE ERRORS
            if (shortfallErrors.length > 0) {
                console.error("❌ INVENTORY SHORTFALLS DETECTED:");
                console.table(shortfallErrors); // This creates a beautiful, readable table in your console
            }

            // 6. JSON VERIFICATION BLOCK
            const finalPayload = {
                sales_to_insert: salesToInsert,
                purchases_to_update: Array.from(purchasesToUpdateMap.values()),
                sales_to_delete: [],
                sales_to_update: []
            };

            const totalRequested = salesToProcess.reduce((sum, r) => {
                const rawQty = r.sale_qty || r.qty || r.Quantity || r.Units || 0;
                const parsedQty = parseFloat(String(rawQty).replace(/,/g, ''));
                return sum + (isNaN(parsedQty) ? 0 : parsedQty);
            }, 0);
            const totalAllocated = salesToInsert.reduce((sum, s) => sum + s.sale_qty, 0);

            console.log("--- FINAL PAYLOAD DATA ---");
            console.log("Total Sale Segments to Insert:", salesToInsert.length);
            console.log("Total Purchase Lots to Update:", purchasesToUpdateMap.size);
            console.log("Final JSON structure:", finalPayload);

            const isVerified = window.confirm(
                `📊 Bulk Sale Verification\n\n` +
                `• CSV Rows: ${salesToProcess.length}\n` +
                `• DB Sale Segments: ${salesToInsert.length}\n` +
                `• Qty Requested: ${totalRequested.toLocaleString()}\n` +
                `• Qty Allocated: ${totalAllocated.toLocaleString()}\n\n` +
                (totalRequested !== totalAllocated ? `⚠️ WARNING: Inventory Shortfall of ${totalRequested - totalAllocated} units!\n\n` : "") +
                `Push these changes to the database?`
            );

            if (!isVerified) {
                setLoading(false);
                return;
            }

            const invalidUpdates = Array.from(purchasesToUpdateMap.values()).filter(
                p => p.balance_qty === null || p.balance_qty === undefined || isNaN(p.balance_qty)
            );

            if (invalidUpdates.length > 0) {
                console.error("⛔ Found invalid balance_qty in payload:", invalidUpdates);
                alert("Data integrity error: Some purchase lots have null balances. Check console.");
                setLoading(false);
                return;
            }

            const { error: rpcErr } = await supabase.rpc('atomic_ledger_update', {
                payload: finalPayload
            });

            if (rpcErr) throw rpcErr;

            console.log(currentLocalId);

            alert(`🏁 Success! Processed ${salesToProcess.length} sales. Final value to update ${currentLocalId}`);

        } catch (err) {
            console.error("Critical Failure:", err);
            alert(`Process Failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }
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
                    onChange={runBulkSale}
                    className="block w-full max-w-xs text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100
                    "
                />
                {loading && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-blue-700">{statusText}</span>
                            <span className="text-sm font-medium text-blue-700">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Please do not close this tab until the process is complete.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
