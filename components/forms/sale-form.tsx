"use client"

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';

export function SaleForm({ clients, setSuccess }: { clients: any[], setSuccess: (success: boolean) => void }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [openPurchases, setOpenPurchases] = useState([]);

    const { register, handleSubmit, reset, watch, setValue } = useForm();

    const saleClient = watch("sale_client_name");

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
    const saleQtyRequested = parseFloat(data.sale_qty || data.qty);
    let remainingQty = saleQtyRequested;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User session not found.");

        // 1. Identify Ticker from the selected batch
        const selectedLot = openPurchases.find((l) => l.trx_id === data.purchase_trx_id);
        const tickerName = selectedLot?.ticker;

        if (!tickerName) throw new Error("Batch selection required.");

        // 2. Fetch active lots directly from 'purchases' table
        // We filter for rows where balance_qty > 0 to ignore fully sold lots
        const { data: lots, error: fetchError } = await supabase
            .from('purchases')
            .select('*')
            .eq('client_name', (data.client_name || data.sale_client_name).trim())
            .eq('ticker', tickerName)
            .gt('balance_qty', 0)
            .order('date', { ascending: true })      // Primary Sort: Purchase Date
            .order('created_at', { ascending: true }); // Secondary Sort: Entry Time (Tie-breaker)

        if (fetchError) throw fetchError;

        // 3. FIFO Sort with Tie-breaker for same-day transactions
        const sortedLots = [...lots].sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) return dateA - dateB;
            // Fallback to database creation order
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        // 4. Pre-check: Cumulative Validation
        const totalAvailable = sortedLots.reduce((sum, lot) => sum + Number(lot.balance_qty), 0);
        if (totalAvailable < saleQtyRequested) {
            throw new Error(`Insufficient stock. Available: ${totalAvailable}`);
        }

        // 5. Generate Group ID
        const { data: nextId } = await supabase.rpc('get_next_sale_id');
        const sharedCustomId = `SALE-2026-${nextId.toString().padStart(4, '0')}`;

        // 6. Process Split Transactions
        for (const lot of sortedLots) {
            if (remainingQty <= 0) break;

            const qtyFromThisLot = Math.min(Number(lot.balance_qty), remainingQty);
            const saleRate = parseFloat(data.sale_rate || data.rate);
            const purchaseRate = parseFloat(lot.purchase_rate || lot.rate);
            
            const profit = (saleRate - purchaseRate) * qtyFromThisLot;
            const isLongTerm = (new Date(data.sale_date || data.date).getTime() - new Date(lot.date).getTime()) > (365 * 24 * 60 * 60 * 1000);

            // A. Update Purchase Batch
            const { error: updateError } = await supabase
                .from('purchases')
                .update({ balance_qty: Number(lot.balance_qty) - qtyFromThisLot })
                .eq('trx_id', lot.trx_id);

            if (updateError) throw updateError;

            // B. Log 1:1 Sale
            const { error: saleError } = await supabase
                .from('sales')
                .insert([{
                    purchase_trx_id: lot.trx_id,
                    custom_id: sharedCustomId,
                    client_name: (data.client_name || data.sale_client_name),
                    client_id: lot.client_id,
                    date: data.sale_date || data.date,
                    rate: saleRate,
                    sale_qty: qtyFromThisLot,
                    profit_stored: profit,
                    long_term: isLongTerm,
                    user_id: user.id,
                    comments: data.comments || `FIFO split from ${sharedCustomId}`
                }]);

            if (saleError) throw saleError;
            remainingQty -= qtyFromThisLot;
        }

        setSuccess(true);
        reset();
    } catch (err) {
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
                <select {...register("sale_client_name")} className="w-full p-2.5 bg-slate-50 border rounded-lg">
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
                <input type="date" defaultValue={getTodayDate()} {...register("sale_date")} className="p-2.5 bg-slate-50 border rounded-lg" />
                <input type="number" step="0.01" {...register("sale_rate")} placeholder="Rate (₹)" className="p-2.5 bg-slate-50 border rounded-lg" />
                <input type="number" {...register("sale_qty")} placeholder="Quantity" className="p-2.5 bg-slate-50 border rounded-lg" />
            </div>

            <button disabled={loading} className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">
                {loading ? "Recording..." : "Confirm Sale"}
            </button>
        </form>
    );
}