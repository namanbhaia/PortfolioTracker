"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Calendar, Users, X, Check, ChevronDown } from 'lucide-react';

interface Client {
    client_id: string;
    client_name: string;
}
export default function HoldingsFilter({ availableClients }: { availableClients: any[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Dropdown State
    const [isClientOpen, setIsClientOpen] = useState(false);

    // Filter States
    const [ticker, setTicker] = useState(searchParams.get('ticker') || '');
    const [shareName, setShareName] = useState(searchParams.get('share_name') || '');
    const [startDate, setStartDate] = useState(searchParams.get('start_date') || '');
    const [endDate, setEndDate] = useState(searchParams.get('end_date') || '');

    const showAll = searchParams.get('show_all') === 'true';
    const selectedClientIds = searchParams.get('client_ids')?.split(',').filter(Boolean) || [];

    const updateFilters = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (!value) params.delete(key);
            else params.set(key, value);
        });
        router.push(`?${params.toString()}`);
    };

    // Auto-update URL for text/date fields
    useEffect(() => {
        const timer = setTimeout(() => {
            updateFilters({
                ticker: ticker.toUpperCase() || null,
                share_name: shareName || null,
                start_date: startDate || null,
                end_date: endDate || null
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [ticker, shareName, startDate, endDate]);

    const toggleClient = (id: string) => {
        const next = selectedClientIds.includes(id)
            ? selectedClientIds.filter(cid => cid !== id)
            : [...selectedClientIds, id];
        updateFilters({ client_ids: next.length > 0 ? next.join(',') : null });
    };

    const clearAll = () => {
        setTicker(''); setShareName(''); setStartDate(''); setEndDate('');
        router.push('?');
    };

    return (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col lg:flex-row items-center gap-3">

                {/* 1. Multi-Select Client Dropdown */}
                <div className="relative w-full lg:w-48 shrink-0">
                    <button
                        onClick={() => setIsClientOpen(!isClientOpen)}
                        className="flex items-center justify-between w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium hover:bg-slate-100 transition-all"
                    >
                        <div className="flex items-center gap-2 text-slate-600 truncate">
                            <Users size={12} className="text-indigo-500" />
                            <span>
                                {selectedClientIds.length === 0
                                    ? "All Accounts"
                                    : `${selectedClientIds.length} Selected`}
                            </span>
                        </div>
                        <ChevronDown size={10} className="text-slate-400" />
                    </button>

                    {isClientOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsClientOpen(false)}></div>
                            <div className="absolute left-0 z-20 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-100">
                                <div className="p-2 max-h-48 overflow-y-auto">
                                    {availableClients.map((client) => (
                                        <button
                                            key={client.client_id}
                                            onClick={() => toggleClient(client.client_id)}
                                            className="flex items-center justify-between w-full px-3 py-2 text-[11px] rounded-lg hover:bg-indigo-50 transition-colors text-left"
                                        >
                                            <span className={selectedClientIds.includes(client.client_id) ? "font-bold text-indigo-600" : "text-slate-600"}>
                                                {client.client_name}
                                            </span>
                                            {selectedClientIds.includes(client.client_id) && <Check size={12} className="text-indigo-600" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* 2. Ticker */}
                <div className="relative w-full lg:w-28 shrink-0">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value)}
                        placeholder="Ticker"
                        className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:ring-2 ring-indigo-500"
                    />
                </div>

                {/* 3. Share Name (Flexible Width) */}
                <div className="relative flex-grow w-full">
                    <input
                        value={shareName}
                        onChange={(e) => setShareName(e.target.value)}
                        placeholder="Security name..."
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] outline-none focus:ring-2 ring-indigo-500"
                    />
                </div>

                {/* 4. Date Range */}
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-xl">
                    <Calendar size={12} className="text-slate-400" />
                    <input
                        type="date" value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent text-[10px] outline-none w-[95px]"
                    />
                    <span className="text-slate-300">-</span>
                    <input
                        type="date" value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent text-[10px] outline-none w-[95px]"
                    />
                </div>

                {/* 5. Balance Toggle */}
                <div className="flex p-1 bg-slate-100 rounded-xl shrink-0">
                    <button
                        onClick={() => updateFilters({ show_all: null })}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${!showAll ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => updateFilters({ show_all: 'true' })}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${showAll ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                    >
                        All
                    </button>
                </div>

                {/* 6. Clear */}
                <button onClick={clearAll} className="p-2 text-slate-400 hover:text-red-500 shrink-0">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}