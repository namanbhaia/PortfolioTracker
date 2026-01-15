"use client"

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle2 } from 'lucide-react';

export function TransactionForm({ clients }: { clients: any[] }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [openPurchases, setOpenPurchases] = useState([]);

    // 1. Setup Form with unique names for the two sections
    const { register, handleSubmit, reset, watch, setValue } = useForm();
    
    // Watch both dropdowns separately
    const purchaseClient = watch("purchase_client_name");
    const saleClient = watch("sale_client_name");

    // NEW: Auto-populate DP and Trading ID logic
    useEffect(() => {
        // Determine which name to search for (prioritize whichever was just changed)
        const activeClientName = purchaseClient || saleClient;
        
        const client = clients.find(
            c => c.client_name?.trim() === activeClientName?.trim()
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
    }, [purchaseClient, saleClient, clients, setValue]);

    // 2. Fetch "Sellable" lots when sale client changes
    useEffect(() => {
        async function fetchLots() {
            if (!saleClient) {
                setOpenPurchases([]);
                return;
            }
            const { data } = await supabase
                .from('user_holdings')
                .select('*')
                .eq('client_name', saleClient.trim())
                .gt('balance_qty', 0);
            setOpenPurchases(data || []);
        }
        fetchLots();
    }, [saleClient, supabase]);

    const onPurchaseSubmit = async (data: any) => {
        setLoading(true);
        // Map form fields back to database column names
        const payload = {
            client_name: data.purchase_client_name,
            ticker: data.ticker?.toUpperCase(),
            date: data.purchase_date,
            rate: parseFloat(data.purchase_rate),
            purchase_qty: parseFloat(data.purchase_qty),
            comments: data.comments,
            client_id: data.client_id
        };

        const { error } = await supabase.from('purchases').insert([payload]);
        if (!error) {
            setSuccess(true);
            reset();
            setTimeout(() => setSuccess(false), 3000);
        }
        setLoading(false);
    };

    const onSaleSubmit = async (data: any) => {
        setLoading(true);
        // Map form fields for sales table
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
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* PURCHASE SECTION */}
            <div className="p-8">
                <h2 className="text-lg font-bold mb-4">Purchase (Buy)</h2>
                <form onSubmit={handleSubmit(onPurchaseSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-500">Client</label>
                            <select {...register("purchase_client_name")} className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 ring-indigo-500">
                                <option value="">Select Client</option>
                                {clients.map(c => <option key={c.client_id} value={c.client_name}>{c.client_name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-500">Ticker</label>
                            <input {...register("ticker")} placeholder="RELIANCE" className="w-full p-2.5 bg-slate-50 border rounded-lg uppercase" />
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
                        <input type="date" {...register("purchase_date")} className="p-2.5 bg-slate-50 border rounded-lg" />
                        <input type="number" step="0.01" {...register("purchase_rate")} placeholder="Rate (₹)" className="p-2.5 bg-slate-50 border rounded-lg" />
                        <input type="number" {...register("purchase_qty")} placeholder="Quantity" className="p-2.5 bg-slate-50 border rounded-lg" />
                    </div>                   

                    <textarea {...register("comments")} placeholder="Notes (Strategy, conviction...)" className="w-full p-2.5 bg-slate-50 border rounded-lg h-24" />

                    <button disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                        {loading ? "Recording..." : "Confirm Purchase"}
                    </button>
                </form>
            </div>

            {/* SALE SECTION */}
            <div className="p-8 border-t bg-slate-50/30">
                <h2 className="text-lg font-bold mb-4">Sale (Sell)</h2>
                <form onSubmit={handleSubmit(onSaleSubmit)} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-500">Select Client First</label>
                        <select {...register("sale_client_name")} className="w-full p-2.5 bg-white border rounded-lg">
                            <option value="">Select Client</option>
                            {clients.map(c => <option key={c.client_id} value={c.client_name}>{c.client_name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-500">Link to Purchase Batch (Lot)</label>
                        <select {...register("purchase_trx_id")} className="w-full p-2.5 bg-white border rounded-lg">
                            <option value="">Select a batch to sell from</option>
                            {openPurchases.map((lot: any) => (
                                <option key={lot.trx_id} value={lot.trx_id}>
                                    {lot.ticker} - Bought on {new Date(lot.purchase_date).toLocaleDateString()} (Avail: {lot.balance_qty})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <input type="date" {...register("sale_date")} className="p-2.5 bg-white border rounded-lg" />
                        <input type="number" step="0.01" {...register("sale_rate")} placeholder="Sale Price (₹)" className="p-2.5 bg-white border rounded-lg" />
                        <input type="number" {...register("sale_qty")} placeholder="Qty to Sell" className="p-2.5 bg-white border rounded-lg" />
                    </div>

                    <button disabled={loading} className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all">
                        {loading ? "Recording..." : "Confirm Sale"}
                    </button>
                </form>
            </div>

            {success && (
                <div className="fixed bottom-4 right-4 bg-emerald-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right-5">
                    <CheckCircle2 size={20} /> Transaction Recorded Successfully!
                </div>
            )}
        </div>
    );
}