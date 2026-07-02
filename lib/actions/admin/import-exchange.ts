"use server"


import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import zlib from 'zlib';
import { calculateProfitMetrics, isLongTerm, isSquareOff } from '@/components/helper/utility';
import { appendAndSortAsset } from '../google-sheets/append-asset';


interface TradeRow {
    trade_date: string;
    trading_id: string;
    isin: string;
    ticker: string;
    stock_name: string;
    exchange: string;
    type: 'B' | 'S';
    qty: number;
    price: number;
    order_ref: string;
    trade_id: string;
}


// Simple robust CSV parser that handles quotes and commas
function parseCSV(text: string): string[][] {
    const result: string[][] = [];
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
        if (!line.trim()) continue;
        const row: string[] = [];
        let insideQuotes = false;
        let entries = '';

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                row.push(entries.trim());
                entries = '';
            } else {
                entries += char;
            }
        }
        row.push(entries.trim());
        result.push(row);
    }
    return result;
}


export async function importExchangeTradesAction(formData: FormData, dryRun: boolean = false) {
    const supabase = await createClient();

    // 1. Identity & RBAC Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized access. Please log in." };


    const { data: profile } = await supabase
        .from('profiles')
        .select('admin_level, client_ids')
        .eq('id', user.id)
        .single();


    if (!profile || Number(profile.admin_level || 0) < 1) {
        return { error: "Permission denied. Administrative access required." };
    }


    const file = formData.get('file') as File;
    if (!file) return { error: "No file uploaded." };


    try {
        // 2. Decompress if gzipped (.gz)
        let fileContent = '';
        const buffer = Buffer.from(await file.arrayBuffer());

        if (file.name.endsWith('.gz') || file.type === 'application/gzip' || file.type === 'application/x-gzip') {
            const decompressed = zlib.gunzipSync(buffer);
            fileContent = decompressed.toString('utf-8');
        } else {
            fileContent = buffer.toString('utf-8');
        }


        // 3. Parse CSV rows
        const rows = parseCSV(fileContent);
        if (rows.length < 2) return { error: "Empty or invalid trade file." };


        const headers = rows[0].map(h => h.trim());
        const dataRows = rows.slice(1);


        // Dynamic column index mapping
        const idxTradDt = headers.indexOf('TradDt');
        const idxSgmt = headers.indexOf('Sgmt');
        const idxFinInstrmTp = headers.indexOf('FinInstrmTp');
        const idxISIN = headers.indexOf('ISIN');
        const idxTckrSymb = headers.indexOf('TckrSymb');
        const idxFinInstrmNm = headers.indexOf('FinInstrmNm');
        const idxClntId = headers.indexOf('ClntId');
        const idxBuySellInd = headers.indexOf('BuySellInd');
        const idxTradQty = headers.indexOf('TradQty');
        const idxPric = headers.indexOf('Pric');
        const idxOrdrRef = headers.indexOf('OrdrRef');
        const idxUnqTradIdr = headers.indexOf('UnqTradIdr');
        const idxXchg = headers.indexOf('Xchg');


        if ([idxTradDt, idxSgmt, idxFinInstrmTp, idxISIN, idxTckrSymb, idxClntId, idxBuySellInd, idxTradQty, idxPric, idxOrdrRef, idxXchg].some(idx => idx === -1)) {
            return { error: "Invalid exchange file format. Missing required columns." };
        }


        // 4. In-Memory Order Aggregation (Weighted Average Price)
        const aggregatedMap = new Map<string, {
            date: string;
            trading_id: string;
            isin: string;
            ticker: string;
            stock_name: string;
            exchange: string;
            type: 'B' | 'S';
            qty: number;
            total_value: number;
            order_ref: string;
            trade_ids: string[];
        }>();


        for (const row of dataRows) {
            // Filters: Capital Market ('CM') and Equity/Stock ('STK') only
            if (row[idxSgmt] !== 'CM' || row[idxFinInstrmTp] !== 'STK') continue;


            const date = row[idxTradDt];
            const tradingId = row[idxClntId];
            const isin = row[idxISIN];
            const ticker = row[idxTckrSymb];
            const name = row[idxFinInstrmNm] || '';
            const exchange = row[idxXchg];
            const type = row[idxBuySellInd] as 'B' | 'S';
            const qty = parseFloat(row[idxTradQty]);
            const price = parseFloat(row[idxPric]);
            const orderRef = row[idxOrdrRef];
            const tradeId = row[idxUnqTradIdr];


            // Composite Key: Date + Client + ISIN + Type + Order Reference
            const key = `${date}::${tradingId}::${isin}::${type}::${orderRef}`;


            if (!aggregatedMap.has(key)) {
                aggregatedMap.set(key, {
                    date,
                    trading_id: tradingId,
                    isin,
                    ticker,
                    stock_name: name,
                    exchange,
                    type,
                    qty: 0,
                    total_value: 0,
                    order_ref: orderRef,
                    trade_ids: []
                });
            }


            const agg = aggregatedMap.get(key)!;
            agg.qty += qty;
            agg.total_value += qty * price;
            agg.trade_ids.push(tradeId);
        }


        const trades: TradeRow[] = Array.from(aggregatedMap.values()).map(agg => ({
            trade_date: agg.date,
            trading_id: agg.trading_id,
            isin: agg.isin,
            ticker: agg.ticker,
            stock_name: agg.stock_name,
            exchange: agg.exchange,
            type: agg.type,
            qty: agg.qty,
            price: Number((agg.total_value / agg.qty).toFixed(4)), // Weighted Average Price
            order_ref: agg.order_ref,
            trade_id: agg.trade_ids[0]
        }));


        if (trades.length === 0) return { error: "No eligible equity transactions found in the file." };


        // 5. Pre-Fetch ALL Database Context in Bulk (Clients, Assets, Purchases)
        // This eliminates N+1 queries by loading everything into memory upfront.
        const [{ data: allClients }, { data: allAssets }] = await Promise.all([
            supabase.from('clients').select('client_id, client_name, trading_id'),
            supabase.from('assets').select('ticker, stock_name, isin, cutoff') // Include cutoff for grandfathering
        ]);


        const clientsMap = new Map<string, any>();
        for (const c of allClients || []) {
            if (!c.trading_id) continue;
            const ids = c.trading_id.split('/').map((id: string) => id.trim().toUpperCase());
            for (const id of ids) {
                clientsMap.set(id, c);
            }
        }
        const assetsMapByIsin = new Map(allAssets?.map(a => [a.isin?.toUpperCase(), a]) || []);
        const assetsMapByTicker = new Map(allAssets?.map(a => [a.ticker?.toUpperCase(), a]) || []);


        const skippedTrades: string[] = [];
        const finalPurchasesToInsert: any[] = [];
        const finalSalesToInsert: any[] = [];
        const finalPurchasesToUpdateMap = new Map<string, any>();


        const tradeDate = trades[0].trade_date;


        // Group valid trades by client/ISIN for FIFO ordering, running RBAC check in the process
        const tradesByStock = new Map<string, TradeRow[]>();
        const authorizedClientNames = new Set<string>();

        for (const t of trades) {
            const client = clientsMap.get(t.trading_id.toUpperCase());
            if (!client) {
                skippedTrades.push(`Row Skipped: Client Code ${t.trading_id} not found.`);
                continue;
            }

            // RBAC Access Check
            const userClientIds = (profile.client_ids || []) as string[];
            if (!userClientIds.includes(client.client_id)) {
                skippedTrades.push(`Row Skipped: Unauthorized access to client ${client.client_name} (${t.trading_id}).`);
                continue;
            }

            authorizedClientNames.add(client.client_name);
            const stockKey = `${client.client_name}::${t.isin}`;
            if (!tradesByStock.has(stockKey)) {
                tradesByStock.set(stockKey, []);
            }
            tradesByStock.get(stockKey)!.push(t);
        }


        // Bulk-fetch ALL active purchase lots for authorized clients in ONE query (eliminates N+1)
        const allDbPurchasesMap = new Map<string, any[]>();
        if (authorizedClientNames.size > 0) {
            const { data: allDbPurchases } = await supabase
                .from('purchases')
                .select('*')
                .in('client_name', Array.from(authorizedClientNames))
                .gt('balance_qty', 0)
                .order('date', { ascending: true })
                .order('created_at', { ascending: true });

            for (const p of allDbPurchases || []) {
                const key = `${p.client_name}::${p.ticker}`;
                if (!allDbPurchasesMap.has(key)) allDbPurchasesMap.set(key, []);
                allDbPurchasesMap.get(key)!.push(p);
            }
        }


        // 6. Processing Pipeline (Stock by Stock)
        for (const [stockKey, stockTrades] of tradesByStock.entries()) {
            const [clientName, isin] = stockKey.split('::');
            const client = allClients?.find(c => c.client_name === clientName)!;


            // Resolve or Auto-Onboard Asset
            let asset = assetsMapByIsin.get(isin.toUpperCase());
            const firstTrade = stockTrades[0];
            const tickerSuffix = firstTrade.exchange === 'NSE' ? 'NS' : 'BO';
            const cleanTicker = `${firstTrade.ticker.toUpperCase()}.${tickerSuffix}`;


            if (!asset) {
                // Self-healing: Check if asset exists by ticker but has wrong/missing ISIN
                const assetByTicker = assetsMapByTicker.get(cleanTicker.toUpperCase());
                if (assetByTicker) {
                    if (!dryRun) {
                        await supabase.from('assets').update({ isin }).eq('ticker', cleanTicker);
                    }
                    asset = { ...assetByTicker, isin };
                } else {
                    // Auto-Onboard Asset
                    if (!dryRun) {
                        await supabase.from('assets').insert({
                            ticker: cleanTicker,
                            stock_name: firstTrade.stock_name,
                            isin: isin,
                            current_price: firstTrade.price
                        });
                        // Sync with Google Asset Sheet in alphabetical order
                        await appendAndSortAsset({
                            ticker: cleanTicker.replace('.NS', '').replace('.BO', ''),
                            name: firstTrade.stock_name,
                            price: firstTrade.price,
                            isin: isin
                        });
                    }
                    asset = { ticker: cleanTicker, stock_name: firstTrade.stock_name, isin, cutoff: null };
                }
            }

            // Retrieve cutoff from the in-memory asset map (no extra DB query needed)
            const cutoffPrice = Number((asset as any).cutoff || 0);


            // Sort trades: Buys ('B') first, then Sells ('S')
            const sortedStockTrades = stockTrades.sort((a, b) => a.type.localeCompare(b.type));

            // Load pre-fetched active purchase lots from in-memory map (no extra DB query)
            const purchasesByTicker = allDbPurchasesMap.get(`${clientName}::${asset.ticker}`) || [];
            const localPurchasesQueue = purchasesByTicker.map(p => ({
                ...p,
                balance_qty: Number(p.balance_qty),
                rate: Number(p.rate),
                sale_ids: p.sale_ids || []
            }));


            // Execute FIFO loop
            for (const t of sortedStockTrades) {
                if (t.type === 'B') {
                    // --- PURCHASE (BUY) INGESTION ---
                    // Generate a valid UUID for the purchase lot. This UUID is used immediately
                    // to link any same-day sells, and is passed to the DB for insertion.
                    const purchaseTrxId = crypto.randomUUID();

                    const newLot = {
                        trx_id: purchaseTrxId,
                        user_id: user.id,
                        client_id: client.client_id,
                        client_name: clientName,
                        ticker: asset.ticker,
                        date: t.trade_date,
                        rate: t.price,
                        purchase_qty: t.qty,
                        balance_qty: t.qty,
                        sale_ids: [],
                        comments: "Imported via Daily Exchange Logging",
                        created_at: new Date().toISOString()
                    };

                    finalPurchasesToInsert.push(newLot);
                    localPurchasesQueue.push(newLot); // Immediately eligible for same-day sells


                } else {
                    // --- SALE (SELL) INGESTION ---
                    let qtyRemaining = t.qty;

                    // FIFO search: only lots with available balance purchased on or before the sale date
                    const eligibleLots = localPurchasesQueue.filter(p => p.balance_qty > 0 && new Date(p.date) <= new Date(t.trade_date));
                    const totalAvailable = eligibleLots.reduce((sum, p) => sum + p.balance_qty, 0);


                    if (totalAvailable < qtyRemaining) {
                        return { error: `Insufficient stock balance for ${clientName} on asset ${asset.ticker}. Needed ${t.qty}, available ${totalAvailable}.` };
                    }


                    for (const p of eligibleLots) {
                        if (qtyRemaining <= 0) break;


                        const take = Math.min(p.balance_qty, qtyRemaining);
                        p.balance_qty -= take;


                        // Generate a valid UUID for this sale split
                        const splitSaleId = crypto.randomUUID();
                        p.sale_ids.push(splitSaleId);


                        // Track updates to this purchase lot
                        const insertedLot = finalPurchasesToInsert.find(l => l.trx_id === p.trx_id);
                        if (insertedLot) {
                            // New lot inserted this run — update in-memory record
                            insertedLot.balance_qty = p.balance_qty;
                            insertedLot.sale_ids = p.sale_ids;
                        } else {
                            // Pre-existing DB lot — record for update
                            finalPurchasesToUpdateMap.set(p.trx_id, {
                                trx_id: p.trx_id,
                                balance_qty: p.balance_qty,
                                sale_ids: p.sale_ids,
                                date: p.date,
                                purchase_qty: p.purchase_qty,
                                rate: p.rate,
                                comments: p.comments
                            });
                        }


                        // Calculate Profit using grandfathering logic
                        const { profit, adjusted_profit } = calculateProfitMetrics(
                            p.rate,
                            new Date(p.date),
                            t.price,
                            cutoffPrice,
                            take
                        );


                        finalSalesToInsert.push({
                            trx_id: splitSaleId,
                            user_id: user.id,
                            client_id: client.client_id,
                            client_name: clientName,
                            ticker: asset.ticker,
                            purchase_trx_id: p.trx_id,
                            date: t.trade_date,
                            sale_qty: take,
                            rate: t.price,
                            profit_stored: profit,
                            adjusted_profit_stored: adjusted_profit,
                            long_term: isLongTerm(new Date(p.date), new Date(t.trade_date)),
                            is_square_off: isSquareOff(p.date, t.trade_date),
                            custom_id: t.order_ref,
                            comments: "Imported via Daily Exchange Logging",
                            created_at: new Date().toISOString()
                        });


                        qtyRemaining -= take;
                    }
                }
            }
        }


        // 7. Commit Phase (Only if NOT a dry run)
        if (!dryRun) {
            // Commit all purchases and sales atomically in one DB RPC call
            const payload = {
                purchases_to_insert: finalPurchasesToInsert,
                purchases_to_update: Array.from(finalPurchasesToUpdateMap.values()),
                sales_to_insert: finalSalesToInsert
            };


            const { error: commitError } = await supabase.rpc('atomic_ledger_update', { payload });
            if (commitError) throw commitError;


            revalidatePath('/dashboard');
        }


        return {
            success: true,
            dryRun,
            report: {
                tradeDate,
                purchasesCount: finalPurchasesToInsert.length,
                salesCount: finalSalesToInsert.length,
                skippedCount: skippedTrades.length,
                skippedReport: skippedTrades,
                purchases: finalPurchasesToInsert.map(p => ({ client_name: p.client_name, ticker: p.ticker, qty: p.purchase_qty, rate: p.rate })),
                sales: finalSalesToInsert.map(s => ({ client_name: s.client_name, ticker: s.ticker, qty: s.sale_qty, rate: s.rate }))
            }
        };


    } catch (err: any) {
        console.error("Exchange Ingestion Error:", err.message);
        return { error: err.message || "Failed to process exchange trade file." };
    }
}
