"use client"

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { SubmitButton } from '@/components/ui/submit-button';
import { calculateProfitMetrics, getGrandfatheredRate, isLongTerm, isSquareOff } from '@/components/helper/utility';
import { revalidateDashboard } from '@/lib/actions/cache-revalidate';
import { AlertCircle } from 'lucide-react';

const supabase = createClient();

export function SaleForm({ clients, setSuccess }: { clients: any[], setSuccess: (success: boolean) => void }) {
    const [loading, setLoading] = useState(false);
    const [openPurchases, setOpenPurchases] = useState<any[]>([]);
    const [pledgedItems, setPledgedItems] = useState<any[]>([]);
    const [pledgeWarning, setPledgeWarning] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const { register, handleSubmit, reset, watch, setValue } = useForm();
    const saleClient = watch("client_name");
    const selectedTrxId = watch("purchase_trx_id");
    const saleQty = watch("sale_qty");

    // Validation Logic
    const selectedLot = openPurchases.find(l => l.trx_id === selectedTrxId);
    const availableBalance = selectedLot?.balance_qty || 0;
    const pledgedQty = pledgedItems.find(p => p.ticker === selectedLot?.ticker)?.pledged_qty || 0;
    const availableUnpledged = availableBalance - pledgedQty;

    const isInvalidQty = saleQty && parseFloat(saleQty) > availableBalance;
    const isPledgeBreach = saleQty && parseFloat(saleQty) > availableUnpledged && parseFloat(saleQty) <= availableBalance;

    // Auto-populate DP and Trading ID
    useEffect(() => {
        const client = clients.find(
            c => c.client_name?.trim() === saleClient?.trim()
        );

        if (client) {
            setValue("dp_id", client.dp_id);
            setValue("trading_id", client.trading_id);
        } else {
            setValue("dp_id", '');
            setValue("trading_id", '');
        }
    }, [saleClient, clients, setValue]);

    // Fetch Sellable lots and Pledges
    useEffect(() => {
        async function fetchData() {
            if (!saleClient) {
                setOpenPurchases([]);
                setPledgedItems([]);
                return;
            }

            const [holdingsRes, pledgesRes] = await Promise.all([
                supabase
                    .from('client_holdings')
                    .select('*')
                    .eq('client_name', saleClient.trim())
                    .gt('balance_qty', 0),
                supabase
                    .from('pledges')
                    .select('ticker, pledged_qty')
                    .eq('client_name', saleClient.trim())
            ]);

            if (holdingsRes.error) console.error("Error fetching holdings:", holdingsRes.error);
            if (pledgesRes.error) console.error("Error fetching pledges:", pledgesRes.error);

            // Logic to make balance_qty cumulative by ticker
            const aggregated = (holdingsRes.data || []).reduce((acc: any[], current: any) => {
                const existing = acc.find(item => item.ticker === current.ticker);
                if (existing) {
                    // Sum the quantities for the same ticker
                    existing.balance_qty += current.balance_qty;
                } else {
                    // Add new ticker entry to the accumulator
                    acc.push({ ...current });
                }
                return acc;
            }, [])
                .sort((a, b) => a.ticker.localeCompare(b.ticker)); // Alphabetical Sort;
            setOpenPurchases(aggregated);
            setPledgedItems(pledgesRes.data || []);
        }
        fetchData();
    }, [saleClient, supabase]);

    const onSaleSubmit = async (data: any) => {
        setLoading(true);
        setFormError(null);

        // Validation for missing fields
        if (!data.client_name || !data.purchase_trx_id || !data.sale_date || !data.sale_rate || !data.sale_qty) {
            setFormError("Please fill all required fields.");
            setLoading(false);
            return;
        }

        // 1. Normalize form data (handling varying field names)
        const saleQtyRequested = parseFloat(data.sale_qty || data.qty);
        const saleRate = parseFloat(data.sale_rate || data.rate);
        const saleDateStr = data.sale_date || data.date;
        const clientName = (data.client_name || data.sale_client_name).trim();
        let remainingQty = saleQtyRequested;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setFormError("User session not found.");
                setLoading(false);
                return;
            }

            // 2. Identify Ticker from the UI selection
            const selectedLot = openPurchases.find((l) => l.trx_id === data.purchase_trx_id);
            const tickerName = selectedLot?.ticker;
            if (!tickerName) {
                setFormError("Ticker not found. Please select a purchase batch.");
                setLoading(false);
                return;
            }

            // 3. Fetch Asset Cutoff (for Adjusted Profit) and Client ID
            const [cutoffPrice, { data: clientData }] = await Promise.all([
                getGrandfatheredRate(supabase, tickerName),
                supabase.from('clients').select('client_id').eq('client_name', clientName).single()
            ]);

            // 4. Fetch active lots from 'purchases' table directly
            const { data: fetchLots, error: fetchError } = await supabase
                .from('purchases')
                .select('*')
                .eq('client_name', clientName)
                .eq('ticker', tickerName)
                .gt('balance_qty', 0)
                .order('date', { ascending: true })       // FIFO Primary
                .order('created_at', { ascending: true }); // FIFO Tie-breaker

            if (fetchError) throw fetchError;

            // Filter out lots strictly after the sale date
            let lots = (fetchLots || []).filter((lot: any) => new Date(lot.date) <= new Date(saleDateStr));

            const saleDateOnly = new Date(saleDateStr).toISOString().split('T')[0];

            const sameDayPurchases = lots.filter((lot: any) => {
                const lotDateOnly = new Date(lot.date).toISOString().split('T')[0];
                return lotDateOnly === saleDateOnly;
            });

            const otherPurchases = lots.filter((lot: any) => {
                const lotDateOnly = new Date(lot.date).toISOString().split('T')[0];
                return lotDateOnly !== saleDateOnly;
            });

            lots = [...sameDayPurchases, ...otherPurchases];

            // 5. Cumulative Validation
            const totalAvailable = lots.reduce((sum: number, lot: any) => sum + Number(lot.balance_qty), 0);
            if (totalAvailable < saleQtyRequested) {
                setFormError(`Insufficient stock for ${tickerName}. Total available: ${totalAvailable}`);
                setLoading(false);
                return;
            }

            // 6. Generate Transaction Group ID
            const { data: nextId } = await supabase.rpc('get_next_sale_id');
            const sharedCustomId = `SALE-${nextId.toString().padStart(4, '0')}`;

            // 7. FIFO Processing Loop
            for (const lot of lots) {
                if (remainingQty <= 0) break;

                const qtyFromThisLot = Math.min(Number(lot.balance_qty), remainingQty);
                const purchaseRate = parseFloat(lot.rate);
                const purchaseDate = new Date(lot.date);
                const saleDate = new Date(saleDateStr);

                // Performance Calculations
                const { profit: standardProfit, adjusted_profit: adjustedProfit } = calculateProfitMetrics(purchaseRate, purchaseDate, saleRate, cutoffPrice, qtyFromThisLot);

                // Holding Period (> 365 days)
                const isTrxLongTerm = isLongTerm(purchaseDate, saleDate);
                // A. Log Sale and get the New Sale UUID
                const { data: saleRow, error: saleError } = await supabase
                    .from('sales')
                    .insert([{
                        purchase_trx_id: lot.trx_id,
                        custom_id: sharedCustomId,
                        client_name: clientName,
                        client_id: clientData?.client_id,
                        date: saleDateStr,
                        rate: saleRate,
                        sale_qty: qtyFromThisLot,
                        profit_stored: standardProfit,
                        adjusted_profit_stored: adjustedProfit,
                        long_term: isTrxLongTerm,
                        is_square_off: isSquareOff(lot.date, saleDateStr),
                        user_id: user.id,
                        comments: data.comments ? `${data.comments} | ${sharedCustomId}` : sharedCustomId
                    }])
                    .select('trx_id')
                    .single();

                if (saleError) throw saleError;

                // B. Update Purchase Table (Atomic Balance + sale_ids append)
                const newBalance = Number(lot.balance_qty) - qtyFromThisLot;
                const { error: updateError } = await supabase.rpc('append_sale_id_to_purchase', {
                    p_purchase_id: lot.trx_id,
                    p_sale_id: saleRow.trx_id,
                    p_new_balance: newBalance
                });

                if (updateError) throw updateError;

                remainingQty -= qtyFromThisLot;
            }

            // 8. Automatic Unpledging check
            const pledgedAmt = pledgedItems.find(p => p.ticker === tickerName)?.pledged_qty || 0;
            const availableUnpledged = totalAvailable - pledgedAmt;

            if (saleQtyRequested > availableUnpledged) {
                const deficit = saleQtyRequested - availableUnpledged;
                const { unpledgeShares } = await import('@/lib/actions/pledge-actions');
                await unpledgeShares(clientName, tickerName, deficit);
                setPledgeWarning(`Sold shares were pledged. System has automatically un-pledged ${deficit} shares for ${tickerName}.`);
            }

            setSuccess(true);
            reset();
            await revalidateDashboard();
            setTimeout(() => setSuccess(false), 3000);

        } catch (err) {
            const error = err as Error;
            console.error("Critical Error:", error.message);
            setFormError(error.message);
        } finally {
            setLoading(false);
        }
    };
    const getTodayDate = () => {
        const date = new Date();
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    return (
        <form onSubmit={handleSubmit(onSaleSubmit)} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Select Client</label>
                <select {...register("client_name", { required: true })} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white transition-colors">
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.client_id} value={c.client_name}>{c.client_name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label htmlFor="dp_id" className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">DP ID</label>
                    <input
                        id="dp_id"
                        {...register("dp_id")}
                        placeholder="DP ID"
                        className="w-full p-2.5 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 dark:placeholder-slate-600 cursor-not-allowed transition-colors"
                        readOnly
                        tabIndex={-1}
                        autoComplete="off"
                        data-testid="dp-id-input"
                    />
                </div>
                <div className="space-y-1">
                    <label htmlFor="trading_id" className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Trading ID</label>
                    <input
                        id="trading_id"
                        {...register("trading_id")}
                        placeholder="Trading ID"
                        className="w-full p-2.5 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 dark:placeholder-slate-600 cursor-not-allowed transition-colors"
                        readOnly
                        tabIndex={-1}
                        autoComplete="off"
                        data-testid="trading-id-input"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                    Link to Purchase Batch (Lot)
                </label>
                <select {...register("purchase_trx_id", { required: true })} required className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg dark:text-white transition-colors">
                    <option value="">Select share to sell</option>
                    {openPurchases.map((lot: any) => {
                        const pledgedQty = pledgedItems.find(p => p.ticker === lot.ticker)?.pledged_qty || 0;
                        const label = pledgedQty > 0
                            ? `${lot.ticker} (Avail: ${lot.balance_qty}, Pledged: ${pledgedQty}/${lot.balance_qty}) - ${lot.stock_name}`
                            : `${lot.ticker} (Avail: ${lot.balance_qty}) - ${lot.stock_name}`;
                        return (
                            <option key={lot.ticker} value={lot.trx_id}>
                                {label}
                            </option>
                        );
                    })}
                </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Sale Date</label>
                    <input
                        type="date"
                        autoComplete="off"
                        required
                        defaultValue={getTodayDate()}
                        {...register("sale_date", { required: true })}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 ring-rose-500/20 focus:border-rose-500 dark:text-white transition-all"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Sale Quantity</label>
                    <input
                        type="number"
                        autoComplete="off"
                        required
                        {...register("sale_qty", { required: true, min: 1 })}
                        placeholder="0"
                        className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none transition-all dark:text-white dark:placeholder-slate-500 ${isInvalidQty
                            ? "border-rose-500 ring-2 ring-rose-500/20"
                            : "focus:ring-2 ring-rose-500/20 focus:border-rose-500"
                            }`}
                    />
                    {isInvalidQty && (
                        <p className="text-[10px] font-bold text-rose-600 animate-pulse">
                            INSUFFICIENT BALANCE (MAX: {availableBalance})
                        </p>
                    )}
                    {isPledgeBreach && (
                        <p className="text-[10px] font-bold text-amber-600">
                            ⚠️ SELLING PLEDGED SHARES ({pledgedQty} PLEDGED)
                        </p>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Sale Rate (₹)</label>
                    <input
                        type="number"
                        step="0.01"
                        autoComplete="off"
                        required
                        {...register("sale_rate", { required: true, min: 0.01 })}
                        placeholder="0.00"
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 ring-rose-500/20 focus:border-rose-500 dark:text-white dark:placeholder-slate-500 transition-all"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Notes</label>
                <textarea
                    {...register("comments")}
                    placeholder="Strategy, conviction, etc..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg h-24 outline-none focus:ring-2 ring-indigo-500 dark:text-white dark:placeholder-slate-500 transition-colors"
                />
            </div>

            {formError && (
                <div className="p-3 text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/30 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 transition-colors">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{formError}</p>
                </div>
            )}

            <SubmitButton
                isPending={loading}
                disabled={isInvalidQty}
                label={isInvalidQty ? "Invalid Quantity" : "Confirm Sale"}
                classname={`w-full py-3 rounded-xl font-bold transition-all shadow-lg ${isInvalidQty
                    ? "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed shadow-none"
                    : "bg-rose-600 dark:bg-rose-500 text-white hover:bg-rose-700 dark:hover:bg-rose-600 shadow-rose-200 dark:shadow-rose-900/20"
                    }`}
                loadingText='Recording Sale'
            />

            {pledgeWarning && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 rounded-xl relative animate-in fade-in zoom-in duration-300 transition-colors">
                    <div className="flex items-start gap-3 pr-8">
                        <div className="mt-0.5">
                            <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625l6.281-10.875zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold">Automatic Un-pledge Executed</p>
                            <p className="text-xs mt-1">{pledgeWarning}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setPledgeWarning(null)}
                        className="absolute top-4 right-4 text-amber-900/50 hover:text-amber-900 transition-colors"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            )}
        </form>
    );
}