"use client"

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, MinusCircle, CheckCircle2 } from 'lucide-react';

export function TransactionForm({ clients }: { clients: any[] }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [openPurchases, setOpenPurchases] = useState([]); // For the Sale dropdown

    // 1. Setup Form
    const { register, handleSubmit, reset, watch, setValue } = useForm();
    const selectedClient = watch("client_name");

    // 2. Fetch "Sellable" lots when client changes
    useEffect(() => {
        async function fetchLots() {
            if (!selectedClient) return;
            const { data } = await supabase
                .from('user_holdings')
                .select('*')
                .eq('client_name', selectedClient)
                .gt('balance_qty', 0);
            setOpenPurchases(data || []);
        }
        fetchLots();
    }, [selectedClient]);

    const onSubmit = async (data: any, type: 'BUY' | 'SELL') => {
        setLoading(true);
        const table = type === 'BUY' ? 'purchases' : 'sales';

        // Auto-populate user_id logic happens on server or via session here
        const { error } = await supabase.from(table).insert([data]);

        if (!error) {
            setSuccess(true);
            reset();
            setTimeout(() => setSuccess(false), 3000);
        }
        setLoading(false);
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <Tabs defaultValue="buy" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-50 rounded-none border-b">
                    <TabsTrigger value="buy" className="data-[state=active]:text-indigo-600 font-bold flex gap-2">
                        <PlusCircle size={18} /> Purchase (Buy)
                    </TabsTrigger>
                    <TabsTrigger value="sell" className="data-[state=active]:text-rose-600 font-bold flex gap-2">
                        <MinusCircle size={18} /> Sale (Sell)
                    </TabsTrigger>
                </TabsList>

                {/* --- PURCHASE FORM --- */}
                <TabsContent value="buy" className="p-8">
                    <form onSubmit={handleSubmit((d) => onSubmit(d, 'BUY'))} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Client</label>
                                <select {...register("client_name")} className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 ring-indigo-500">
                                    <option value="">Select Client</option>
                                    {clients.map(c => <option key={c.client_name}>{c.client_name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase text-slate-500">Ticker</label>
                                <input {...register("ticker")} placeholder="RELIANCE" className="w-full p-2.5 bg-slate-50 border rounded-lg uppercase" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <input type="date" {...register("date")} className="p-2.5 bg-slate-50 border rounded-lg" />
                            <input type="number" step="0.01" {...register("rate")} placeholder="Rate (₹)" className="p-2.5 bg-slate-50 border rounded-lg" />
                            <input type="number" {...register("qty")} placeholder="Quantity" className="p-2.5 bg-slate-50 border rounded-lg" />
                        </div>

                        <textarea {...register("comments")} placeholder="Notes (Strategy, conviction...)" className="w-full p-2.5 bg-slate-50 border rounded-lg h-24" />

                        <button disabled={loading} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                            {loading ? "Recording..." : "Confirm Purchase"}
                        </button>
                    </form>
                </TabsContent>

                {/* --- SALE FORM --- */}
                <TabsContent value="sell" className="p-8">
                    <form onSubmit={handleSubmit((d) => onSubmit(d, 'SELL'))} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-500">Select Client First</label>
                            <select {...register("client_name")} className="w-full p-2.5 bg-slate-50 border rounded-lg">
                                <option value="">Select Client</option>
                                {clients.map(c => <option key={c.client_name}>{c.client_name}</option>)}
                            </select>
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
                            <input type="date" {...register("date")} className="p-2.5 bg-slate-50 border rounded-lg" />
                            <input type="number" step="0.01" {...register("rate")} placeholder="Sale Price (₹)" className="p-2.5 bg-slate-50 border rounded-lg" />
                            <input type="number" {...register("qty")} placeholder="Qty to Sell" className="p-2.5 bg-slate-50 border rounded-lg" />
                        </div>

                        <button disabled={loading} className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all">
                            {loading ? "Recording..." : "Confirm Sale"}
                        </button>
                    </form>
                </TabsContent>
            </Tabs>

            {success && (
                <div className="bg-emerald-500 text-white p-4 text-center flex items-center justify-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                    <CheckCircle2 size={20} /> Transaction Recorded Successfully!
                </div>
            )}
        </div>
    );
}