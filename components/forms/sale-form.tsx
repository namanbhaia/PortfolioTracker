"use client"

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { processSale } from '@/app/actions/sales';

export function SaleForm({ clients, setSuccess }: { clients: any[], setSuccess: (success: boolean) => void }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [tickers, setTickers] = useState<string[]>([]);
    const [formError, setFormError] = useState<string | null>(null);

    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            sale_date: new Date().toISOString().split('T')[0]
        }
    });

    const saleClient = watch("sale_client_name");
    const saleClientId = watch("client_id");

    // Auto-populate DP and Trading ID and client_id form value
    useEffect(() => {
        const client = clients.find(
            c => c.client_name?.trim() === saleClient?.trim()
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
    }, [saleClient, clients, setValue]);

    // Fetch unique tickers for the selected client
    useEffect(() => {
        async function fetchTickers() {
            if (!saleClientId) {
                setTickers([]);
                return;
            }

            const { data } = await supabase
                .from('purchases')
                .select('ticker')
                .eq('client_id', saleClientId)
                .gt('balance_qty', 0);

            if (data) {
                const uniqueTickers = Array.from(new Set(data.map((item: any) => item.ticker)));
                setTickers(uniqueTickers);
                setValue('ticker', ''); // Reset ticker selection
            } else {
                setTickers([]);
            }
        }
        fetchTickers();
    }, [saleClientId, supabase, setValue]);

    const onSaleSubmit = async (data: any) => {
        setLoading(true);
        setFormError(null);
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            formData.append(key, data[key]);
        });

        const result = await processSale(formData);

        if (result.success) {
            setSuccess(true);
            reset();
            setTimeout(() => setSuccess(false), 3000);
        } else {
            setFormError(result.message || "An unknown error occurred.");
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit(onSaleSubmit)} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {formError && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                    {formError}
                </div>
            )}
            {/* Client Selection */}
            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Select Client</label>
                <select {...register("sale_client_name")} className="w-full p-2.5 bg-slate-50 border rounded-lg">
                    <option value="">Select Client</option>
                    {clients.map(c => <option key={c.client_id} value={c.client_name}>{c.client_name}</option>)}
                </select>
                <input type="hidden" {...register("client_id")} />
            </div>

            {/* IDs */}
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

            {/* Ticker Selection */}
            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Ticker</label>
                <select {...register("ticker")} className="w-full p-2.5 bg-slate-50 border rounded-lg">
                    <option value="">Select Ticker</option>
                    {tickers.map(ticker => (
                        <option key={ticker} value={ticker}>{ticker}</option>
                    ))}
                </select>
            </div>

            {/* Sale Details */}
            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Sale Date</label>
                    <input type="date" {...register("sale_date")} className="p-2.5 bg-slate-50 border rounded-lg w-full" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Sale Price</label>
                    <input type="number" step="0.01" {...register("sale_rate")} placeholder="Price (₹)" className="p-2.5 bg-slate-50 border rounded-lg w-full" />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-slate-500">Quantity</label>
                    <input type="number" {...register("sale_qty")} placeholder="Qty" className="p-2.5 bg-slate-50 border rounded-lg w-full" />
                </div>
            </div>

            {/* Comments */}
            <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Comments</label>
                <textarea {...register("comments")} placeholder="Notes about the sale..." className="w-full p-2.5 bg-slate-50 border rounded-lg h-24" />
            </div>


            <button disabled={loading} className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">
                {loading ? "Recording..." : "Confirm Sale"}
            </button>
        </form>
    );
}