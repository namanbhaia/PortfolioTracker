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
        let remainingQty = parseFloat(data.sale_qty);

        try {
            // 1. Get Ticker from the selected batch
            const selectedLot = openPurchases.find((l) => l.trx_id === data.purchase_trx_id);
            const tickerName = selectedLot?.ticker;

            if (!tickerName) throw new Error("Ticker not found for selected batch.");

            // 2. Fetch all available lots for this ticker
            const { data: lots, error: fetchError } = await supabase
                .from('client_holdings')
                .select('*')
                .eq('client_name', data.sale_client_name.trim())
                .eq('ticker', tickerName)
                .gt('balance_qty', 0);

            if (fetchError) throw fetchError;

            // 3. FIFO Sort (Handling your Text Dates safely)
            const sortedLots = (lots || []).sort((a, b) => {
                const dateA = new Date(a.purchase_date).getTime() || 0;
                const dateB = new Date(b.purchase_date).getTime() || 0;
                return dateA - dateB;
            });

            for (const lot of sortedLots) {
                if (remainingQty <= 0) break;

                const qtyToTake = Math.min(Number(lot.balance_qty), remainingQty);
                const newBalance = Number(lot.balance_qty) - qtyToTake;

                // DEBUG: Copy this ID from your console and search it in Supabase manually
                console.log("Processing ID:", lot.trx_id);

                const { data: { user } } = await supabase.auth.getUser();
                console.log("Logged in user ID:", user.id);

                const { data, error } = await supabase
                    .from('purchases')
                    .update({ 
                        balance_qty: newBalance,
                        comments: `Sold ${qtyToTake} on ${new Date().toLocaleDateString()}` 
                    })
                    .eq('trx_id', lot.trx_id.trim()) // Ensure no whitespace
                    .select(); // This is crucial to see if the database actually changed anything

                if (error) {
                    console.error("Update failed:", error.message);
                } else if (data && data.length > 0) {
                    console.log("Update SUCCESS:", data[0]);
                } else {
                    console.warn("Update finished but 0 rows changed. Check if trx_id matches.");
                }

                remainingQty -= qtyToTake;
            }

            // 5. Finalize Sale Record
            if (remainingQty === 0) {
                const { error: saleError } = await supabase
                    .from('sales')
                    .insert([{
                        purchase_trx_id: data.purchase_trx_id, // uuid
                        client_name: data.sale_client_name,    // text
                        date: data.sale_date,                  // date (Postgres will auto-cast 'YYYY-MM-DD')
                        rate: parseFloat(data.sale_rate),      // numeric
                        sale_qty: parseFloat(data.sale_qty),   // numeric
                        comments: data.comments || "FIFO Sale" // text
                    }]);
                if (saleError) throw saleError;
                setSuccess(true);
                reset();
            } else {
                throw new Error(`Insufficient stock. Shortfall: ${remainingQty}`);
            }

        } catch (err) {
            console.error("Process Failed:", err.message);
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