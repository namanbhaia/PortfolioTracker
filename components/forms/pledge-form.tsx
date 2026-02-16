"use client"

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import { Lock, Unlock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { pledgeShares, unpledgeShares } from '@/lib/actions/pledge-actions';
import { SubmitButton } from '@/components/ui/submit-button';

export function PledgeForm({ clients }: { clients: any[] }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pledge' | 'unpledge'>('pledge');
    const [holdings, setHoldings] = useState<any[]>([]);
    const [pledgedItems, setPledgedItems] = useState<any[]>([]);

    const { register, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            client_name: '',
            ticker: '',
            qty: '',
            comments: ''
        }
    });

    const selectedClient = watch("client_name");

    // Fetch data when client changes
    useEffect(() => {
        async function fetchData() {
            if (!selectedClient) {
                setHoldings([]);
                setPledgedItems([]);
                return;
            }

            // Fetch holdings (balance qty)
            const { data: holdingsData } = await supabase
                .from('client_holdings')
                .select('ticker, stock_name, balance_qty')
                .eq('client_name', selectedClient)
                .gt('balance_qty', 0);

            // Fetch currently pledged
            const { data: pledgeData } = await supabase
                .from('pledges')
                .select('ticker, pledged_qty')
                .eq('client_name', selectedClient);

            // Aggregate holdings by ticker
            const aggregatedHoldings = (holdingsData || []).reduce((acc: any[], curr: any) => {
                const existing = acc.find(i => i.ticker === curr.ticker);
                if (existing) {
                    existing.balance_qty += Number(curr.balance_qty);
                } else {
                    acc.push({ ...curr, balance_qty: Number(curr.balance_qty) });
                }
                return acc;
            }, []);

            setHoldings(aggregatedHoldings);
            setPledgedItems(pledgeData || []);
        }
        fetchData();
    }, [selectedClient, supabase]);

    const onSubmit = async (data: any) => {
        const qtyToProcess = Number(data.qty);
        const selectedOption = tickerOptions.find(o => o.ticker === data.ticker);

        if (activeTab === 'pledge' && selectedOption && qtyToProcess > selectedOption.available) {
            setError(`Cannot pledge ${qtyToProcess} shares. Maximum available: ${selectedOption.available}`);
            return;
        }

        if (activeTab === 'unpledge' && selectedOption && qtyToProcess > selectedOption.available) {
            setError(`Cannot unpledge ${qtyToProcess} shares. Currently pledged: ${selectedOption.available}`);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'pledge') {
                await pledgeShares(data.client_name, data.ticker, qtyToProcess);
            } else {
                await unpledgeShares(data.client_name, data.ticker, qtyToProcess);
            }
            setSuccess(true);
            reset({
                ...data,
                client_name: data.client_name,
                ticker: '',
                qty: '',
                comments: ''
            });
            // Refresh data
            const { data: pledgeData } = await supabase
                .from('pledges')
                .select('ticker, pledged_qty')
                .eq('client_name', selectedClient);
            setPledgedItems(pledgeData || []);

            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Calculate options for the ticker dropdown
    const tickerOptions = activeTab === 'pledge'
        ? holdings.map(h => {
            const pledged = pledgedItems.find(p => p.ticker === h.ticker)?.pledged_qty || 0;
            const available = h.balance_qty - pledged;
            return { ticker: h.ticker, label: `${h.ticker} (Avail: ${available})`, available };
        }).filter(o => o.available > 0)
        : pledgedItems.map(p => ({
            ticker: p.ticker,
            label: `${p.ticker} (Pledged: ${p.pledged_qty})`,
            available: p.pledged_qty
        }));

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50/50">
                <button
                    onClick={() => { setActiveTab('pledge'); reset(); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all ${activeTab === 'pledge'
                        ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                        : "text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <Lock size={18} />
                    Pledge Shares
                </button>
                <button
                    onClick={() => { setActiveTab('unpledge'); reset(); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all ${activeTab === 'unpledge'
                        ? "bg-white text-emerald-600 border-b-2 border-emerald-600"
                        : "text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <Unlock size={18} />
                    Unpledge Shares
                </button>
            </div>

            <div className="p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-500">Select Client</label>
                        <select
                            {...register("client_name", { required: true })}
                            className="w-full p-2.5 bg-slate-50 border rounded-lg focus:ring-2 ring-indigo-500 outline-none"
                        >
                            <option value="">Select Client</option>
                            {clients.map(c => <option key={c.client_name} value={c.client_name}>{c.client_name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-500">
                                Share to {activeTab === 'pledge' ? 'Pledge' : 'Unpledge'}
                            </label>
                            <select
                                {...register("ticker", { required: true })}
                                className="w-full p-2.5 bg-slate-50 border rounded-lg focus:ring-2 ring-indigo-500 outline-none"
                            >
                                <option value="">Select Ticker</option>
                                {tickerOptions.map(opt => (
                                    <option key={opt.ticker} value={opt.ticker}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase text-slate-500">Quantity</label>
                            <input
                                type="number"
                                {...register("qty", { required: true })}
                                placeholder="Qty"
                                className="w-full p-2.5 bg-slate-50 border rounded-lg focus:ring-2 ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-slate-500">Comments</label>
                        <textarea
                            {...register("comments")}
                            placeholder="Reason for action..."
                            className="w-full p-2.5 bg-slate-50 border rounded-lg h-24 focus:ring-2 ring-indigo-500 outline-none"
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <SubmitButton
                        isPending={loading}
                        label={`Confirm ${activeTab === 'pledge' ? 'Pledge' : 'Unpledge'}`}
                        classname={`w-full py-3 text-white rounded-xl font-bold transition-all shadow-lg ${activeTab === 'pledge'
                            ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                            }`}
                        loadingText="Processing..."
                    />
                </form>

                {success && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
                        <CheckCircle2 size={20} /> Action Recorded Successfully!
                    </div>
                )}
            </div>
        </div>
    );
}
