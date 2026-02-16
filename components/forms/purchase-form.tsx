"use client"

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { getTodayDate } from '../helper/utility';
import { SubmitButton } from '@/components/ui/submit-button';

export function PurchaseForm({ clients, setSuccess }: { clients: any[], setSuccess: (success: boolean) => void }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    // Initialize useForm with defaultValues
    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            purchase_date: getTodayDate(), // Sets the default on mount
            purchase_rate: '',
            purchase_qty: '',
            ticker: '',
            purchase_client_name: '',
            comments: '',
            dp_id: '',
            trading_id: '',
            client_id: ''
        }
    });

    const purchaseClient = watch("purchase_client_name");

    // Auto-populate DP and Trading ID logic...
    useEffect(() => {
        const client = clients.find(
            c => c.client_name?.trim() === purchaseClient?.trim()
        );

        if (client) {
            setValue("dp_id", client.dp_id);
            setValue("trading_id", client.trading_id);
            setValue("client_id", client.client_id);
        } else {
            setValue("dp_id", '');
            setValue("trading_id", '');
            setValue("client_id", '');
        }
    }, [purchaseClient, clients, setValue]);

    const onPurchaseSubmit = async (data: any) => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert("You must be logged in to record a purchase.");
            setLoading(false);
            return;
        }

        const payload = {
            user_id: user.id,
            client_id: data.client_id,
            client_name: data.purchase_client_name,
            ticker: data.ticker?.toUpperCase(),
            date: data.purchase_date,
            rate: parseFloat(data.purchase_rate),
            purchase_qty: parseFloat(data.purchase_qty),
            balance_qty: parseFloat(data.purchase_qty),
            comments: data.comments
        };

        const { error } = await supabase.from('purchases').insert([payload]);

        if (error) {
            alert(error.message);
        } else {
            setSuccess(true);
            reset({
                ...data, // Optional: keep some data, or just reset to defaults:
                purchase_date: getTodayDate(),
                ticker: '',
                purchase_rate: '',
                purchase_qty: '',
                comments: ''
            });
            setTimeout(() => setSuccess(false), 3000);
        }
        setLoading(false);
    };
    return (
        <form onSubmit={handleSubmit(onPurchaseSubmit)} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Client</label>
                    <select
                        {...register("purchase_client_name")}
                        className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 ring-indigo-500"
                    >
                        <option value="">Select Client</option>
                        {clients.map((c, index) => (
                            <option
                                key={c.client_id || `client-${index}`}
                                value={c.client_name}
                            >
                                {c.client_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Ticker</label>
                    <input {...register("ticker")} autoComplete="off" placeholder="Ticker" className="w-full p-2.5 bg-slate-50 border rounded-lg" />
                </div>
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

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Purchase Date</label>
                    <input
                        type="date"
                        autoComplete="off"
                        {...register("purchase_date")}
                        className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 ring-indigo-500"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Purchase Rate (₹)</label>
                    <input
                        type="number"
                        step="0.01"
                        autoComplete="off"
                        {...register("purchase_rate")}
                        placeholder="0.00"
                        className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 ring-indigo-500"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Purchase Quantity</label>
                    <input
                        type="number"
                        autoComplete="off"
                        {...register("purchase_qty")}
                        placeholder="0"
                        className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 ring-indigo-500"
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
                label="Confirm Purchase"
                classname="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                loadingText='Recording Purchase'
            />
        </form>
    );
}