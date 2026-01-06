"use client"

import React from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { PlusCircle, Loader2 } from 'lucide-react';

export function PurchaseForm({ clients }: { clients: any[] }) {
    const supabase = createClient();
    const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

    const onSubmit = async (data: any) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            const { error } = await supabase.from('purchases').insert([{
                ...data,
                user_id: user?.id,
                ticker: data.ticker.toUpperCase(),
            }]);

            if (error) throw error;
            alert("Purchase recorded successfully!");
            reset();
        } catch (err: any) {
            alert(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Target Client</label>
                    <select
                        {...register("client_name", { required: true })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 ring-indigo-500 outline-none"
                    >
                        <option value="">Select Account...</option>
                        {clients.map(c => <option key={c.client_name} value={c.client_name}>{c.client_name}</option>)}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ticker / Symbol</label>
                    <input
                        {...register("ticker", { required: true })}
                        placeholder="e.g., RELIANCE"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg uppercase font-bold"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date</label>
                    <input type="date" {...register("date", { required: true })} className="w-full p-2 bg-slate-50 border rounded-lg text-sm" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rate (₹)</label>
                    <input type="number" step="0.01" {...register("rate", { required: true })} placeholder="0.00" className="w-full p-2 bg-slate-50 border rounded-lg text-sm" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quantity</label>
                    <input type="number" {...register("qty", { required: true })} placeholder="0" className="w-full p-2 bg-slate-50 border rounded-lg text-sm" />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Investment Rationale</label>
                <textarea
                    {...register("comments")}
                    placeholder="Why are you adding this to the portfolio?"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm h-24 italic"
                />
            </div>

            <button
                disabled={isSubmitting}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />}
                Log Purchase
            </button>
        </form>
    );
}