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
            const { data } = await supabase
                .from('client_holdings')
                .select('*')
                .eq('client_name', saleClient.trim())
                .gt('balance_qty', 0);
            setOpenPurchases(data || []);
        }
        fetchLots();
    }, [saleClient, supabase]);

    const onSaleSubmit = async (data: any) => {
        setLoading(true);
        const payload = {
            purchase_trx_id: data.purchase_trx_id,
            date: data.sale_date,
            rate: parseFloat(data.sale_rate),
            sale_qty: parseFloat(data.sale_qty),
            comments: data.sale_comments
        };

        const { error } = await supabase.from('sales').insert([payload]);
        if (!error) {
            setSuccess(true);
            reset();
            setTimeout(() => setSuccess(false), 3000);
        }
        setLoading(false);
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
                <label className="text-xs font-bold uppercase text-slate-500">Link to Purchase Batch (Lot)</label>
                <select {...register("purchase_trx_id")} className="w-full p-2.5 bg-slate-50 border rounded-lg">
                    <option value="">Select a batch to sell from</option>
                    {openPurchases.map((lot: any) => (
                        <option key={lot.trx_id} value={lot.trx_id}>
                            {lot.ticker} - Bought on {new Date(lot.purchase_date).toLocaleDateString()} (Avail: {lot.balance_qty})
                        </option>
                    ))}
                </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <input type="date" {...register("sale_date")} className="p-2.5 bg-slate-50 border rounded-lg" />
                <input type="number" step="0.01" {...register("sale_rate")} placeholder="Price" className="p-2.5 bg-slate-50 border rounded-lg" />
                <input type="number" {...register("sale_qty")} placeholder="Qty" className="p-2.5 bg-slate-50 border rounded-lg" />
            </div>

            <button disabled={loading} className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">
                {loading ? "Recording..." : "Confirm Sale"}
            </button>
        </form>
    );
}