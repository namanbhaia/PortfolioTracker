"use client"

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { SubmitButton } from '@/components/ui/submit-button';

export function SaleForm({ clients, setSuccess }: { clients: any[], setSuccess: (success: boolean) => void }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [openPurchases, setOpenPurchases] = useState([]);

    const { register, handleSubmit, reset, watch, setValue } = useForm();

    const saleClient = watch("client_name");

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

    // Fetch Sellable lots
    useEffect(() => {
        async function fetchLots() {
            if (!saleClient) {
                setOpenPurchases([]);
                return;
            }

            const { data, error } = await supabase
                .from('client_holdings')
                .select('*')
                .eq('client_name', saleClient.trim())
                .gt('balance_qty', 0);

            if (error) {
                console.error("Error fetching holdings:", error);
                return;
            }

            // Logic to make balance_qty cumulative by ticker
            const aggregated = (data || []).reduce((acc: any[], current: any) => {
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
        }
        fetchLots();
    }, [saleClient, supabase]);

    const onSaleSubmit = async (data) => {
        setLoading(true);
        // 1. Normalize form data (handling varying field names)
        const saleQtyRequested = parseFloat(data.sale_qty || data.qty);
        const saleRate = parseFloat(data.sale_rate || data.rate);
        const saleDateStr = data.sale_date || data.date;
        const clientName = (data.client_name || data.sale_client_name).trim();
        let remainingQty = saleQtyRequested;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User session not found.");

            // 2. Identify Ticker from the UI selection
            const selectedLot = openPurchases.find((l) => l.trx_id === data.purchase_trx_id);
            const tickerName = selectedLot?.ticker;
            if (!tickerName) throw new Error("Ticker not found. Please select a purchase batch.");

            // 3. Fetch Asset Cutoff (for Adjusted Profit) and Client ID
            const [{ data: assetData }, { data: clientData }] = await Promise.all([
                supabase.from('assets').select('cutoff').eq('ticker', tickerName).single(),
                supabase.from('clients').select('client_id').eq('client_name', clientName).single()
            ]);

            const cutoffPrice = assetData?.cutoff;

            // 4. Fetch active lots from 'purchases' table directly
            const { data: lots, error: fetchError } = await supabase
                .from('purchases')
                .select('*')
                .eq('client_name', clientName)
                .eq('ticker', tickerName)
                .gt('balance_qty', 0)
                .order('date', { ascending: true })       // FIFO Primary
                .order('created_at', { ascending: true }); // FIFO Tie-breaker

            if (fetchError) throw fetchError;

            // 5. Cumulative Validation
            const totalAvailable = (lots || []).reduce((sum, lot) => sum + Number(lot.balance_qty), 0);
            if (totalAvailable < saleQtyRequested) {
                throw new Error(`Insufficient stock for ${tickerName}. Total available: ${totalAvailable}`);
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
                const standardProfit = (saleRate - purchaseRate) * qtyFromThisLot;

                // Grandfathering Logic (Feb 1, 2018 cutoff)
                let adjustedProfit = standardProfit;
                if (purchaseDate < new Date('2018-02-01') && cutoffPrice != null) {
                    adjustedProfit = (saleRate - cutoffPrice) * qtyFromThisLot;
                }

                // Holding Period (> 365 days)
                const isLongTerm = (saleDate.getTime() - purchaseDate.getTime()) > (365 * 24 * 60 * 60 * 1000);

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
                        long_term: isLongTerm,
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

            setSuccess(true);
            reset();
            alert(`Transaction ${sharedCustomId} recorded successfully!`);

        } catch (err) {
            console.error("Critical Error:", err.message);
            alert(err.message);
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
                <label className="text-xs font-bold uppercase text-slate-500">Select Client</label>
                <select {...register("client_name")} className="w-full p-2.5 bg-slate-50 border rounded-lg">
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.client_id} value={c.client_name}>{c.client_name}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">DP ID</label>
                    <input {...register("dp_id")} readOnly className="w-full p-2.5 bg-slate-100 border rounded-lg text-slate-600 cursor-not-allowed" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Trading ID</label>
                    <input {...register("trading_id")} readOnly className="w-full p-2.5 bg-slate-100 border rounded-lg text-slate-600 cursor-not-allowed" />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">
                    Link to Purchase Batch (Lot)
                </label>
                <select {...register("purchase_trx_id")} className="w-full p-2.5 bg-slate-50 border rounded-lg">
                    <option value="">Select share to sell</option>
                    {openPurchases.map((lot: any) => (
                        <option key={lot.ticker} value={lot.trx_id}>
                            {lot.ticker} (Avail: {lot.balance_qty})
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Sale Date</label>
                    <input
                        type="date"
                        defaultValue={getTodayDate()}
                        {...register("sale_date")}
                        className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 ring-rose-500/20 focus:border-rose-500 transition-all"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Sale Rate (₹)</label>
                    <input
                        type="number"
                        step="0.01"
                        {...register("sale_rate")}
                        placeholder="0.00"
                        className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 ring-rose-500/20 focus:border-rose-500 transition-all"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Sale Quantity</label>
                    <input
                        type="number"
                        {...register("sale_qty")}
                        placeholder="0"
                        className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 ring-rose-500/20 focus:border-rose-500 transition-all"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Notes</label>
                <textarea
                    {...register("comments")}
                    placeholder="Strategy, conviction, etc..."
                    className="w-full p-2.5 bg-slate-50 border rounded-lg h-24 outline-none focus:ring-2 ring-indigo-500"
                />
            </div>

            <SubmitButton 
                isPending={loading} 
                label="Confirm Sale" 
                classname="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                loadingText='Recording Sale'
            />
        </form>
    );
}