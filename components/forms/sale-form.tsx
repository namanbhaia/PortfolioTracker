"use client"

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { MinusCircle, Loader2, Info } from 'lucide-react';

export function SaleForm({ clients }: { clients: any[] }) {
    const supabase = createClient();
    const [availableLots, setAvailableLots] = useState([]);
    const [loadingLots, setLoadingLots] = useState(false);

    const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm();
    const selectedClient = watch("client_name");

    // Fetch only active lots for the chosen client
    useEffect(() => {
        async function getLots() {
            if (!selectedClient) return;
            setLoadingLots(true);
            const { data } = await supabase
                .from('user_holdings') // Your SQL View
                .select('trx_id, ticker, purchase_date, balance_qty, purchase_rate')
                .eq('client_name', selectedClient)
                .gt('balance_qty', 0);
            setAvailableLots(data || []);
            setLoadingLots(false);
        }
        getLots();
    }, [selectedClient, supabase]);

    const onSubmit = async (data: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { error } = await supabase.from('sales').insert([{
                ...data,
                user_id: user?.id,
            }]);

            if (error) throw error;
            alert("Sale recorded!");
            reset();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-2">
            <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">1. Select Account</label>
                <select {...register("client_name", { required: true })} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <option value="">Select...</option>
                    {clients.map(c => <option key={c.client_name} value={c.client_name}>{c.client_name}</option>)}
                </select>
            </div>

            <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">2. Link to Purchase Batch</label>
                <select
                    {...register("purchase_trx_id", { required: true })}
                    disabled={!selectedClient || loadingLots}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-50"
                >
                    <option value="">{loadingLots ? "Loading Lots..." : "Choose the specific buy to sell from..."}</option>
                    {availableLots.map((lot: any) => (
                        <option key={lot.trx_id} value={lot.trx_id}>
                            {lot.ticker} | Bought {new Date(lot.purchase_date).toLocaleDateString()} | Avail: {lot.balance_qty} @ ₹{lot.purchase_rate}
                        </option>
                    ))}
                </select>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Info size={10} /> This ensures accurate Capital Gains tax calculation.
                </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sale Date</label>
                    <input type="date" {...register("date", { required: true })} className="w-full p-2 bg-slate-50 border rounded-lg text-sm" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sale Rate (₹)</label>
                    <input type="number" step="0.01" {...register("rate", { required: true })} className="w-full p-2 bg-slate-50 border rounded-lg text-sm" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Qty Sold</label>
                    <input type="number" {...register("qty", { required: true })} className="w-full p-2 bg-slate-50 border rounded-lg text-sm" />
                </div>
            </div>

            <textarea {...register("comments")} placeholder="Sale notes (e.g., Target hit, Stop loss triggered)" className="w-full p-3 bg-slate-50 border rounded-lg text-sm h-20 italic" />

            <button
                disabled={isSubmitting || !selectedClient}
                className="w-full py-3.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <MinusCircle size={18} />}
                Log Sale
            </button>
        </form>
    );
}