"use client";

import React from 'react';
import { Search, Calendar, X } from 'lucide-react';
import { ClientMultiSelect } from './client-filter';

export default function HoldingsFilter({
    availableClients,
    showLongTermToggle = true,
    showBalanceToggle = true,

    // NEW PROPS FOR LOCAL STATE
    ticker, setTicker,
    shareName, setShareName,
    startDate, setStartDate,
    endDate, setEndDate,
    showAll, setShowAll,
    longTerm, setLongTerm,
    selectedClientIds, setSelectedClientIds
}: {
    availableClients: Record<string, any>[],
    showLongTermToggle?: boolean,
    showBalanceToggle?: boolean,

    ticker?: string,
    setTicker?: (val: string) => void,
    shareName?: string,
    setShareName?: (val: string) => void,
    startDate?: string,
    setStartDate?: (val: string) => void,
    endDate?: string,
    setEndDate?: (val: string) => void,
    showAll?: boolean,
    setShowAll?: (val: boolean) => void,
    longTerm?: boolean | null | 'square_off',
    setLongTerm?: (val: boolean | null | 'square_off') => void,
    selectedClientIds?: string[],
    setSelectedClientIds?: (val: string[]) => void
}) {

    const handleClientChange = (id: string) => {
        if (!setSelectedClientIds || !selectedClientIds) return;

        const next = selectedClientIds.includes(id)
            ? selectedClientIds.filter(cid => cid !== id)
            : [...selectedClientIds, id];

        setSelectedClientIds(next);
    };

    const clearAll = () => {
        setTicker?.('');
        setShareName?.('');
        setStartDate?.('');
        setEndDate?.('');
        setShowAll?.(false);
        setLongTerm?.(null);
        setSelectedClientIds?.([]);
    };

    return (
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            {/* Tighter gap, flex-wrap for mobile but nowrap for large screens */}
            <div className="flex flex-col lg:flex-row flex-wrap lg:flex-nowrap items-center gap-2">

                {/* 1. Client Filter - Fixed Narrow Width */}
                <ClientMultiSelect
                    clients={availableClients}
                    selectedKeys={selectedClientIds || []}
                    onChange={handleClientChange}
                    identifier="client_id"
                    className="w-full lg:w-48 shrink-0"
                />

                {/* 2. Ticker */}
                <div className="relative w-full lg:w-48 shrink-0">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                    <input
                        value={ticker || ''}
                        onChange={(e) => setTicker?.(e.target.value)}
                        placeholder="Ticker"
                        autoComplete="off"
                        className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:ring-2 ring-indigo-500"
                    />
                </div>

                {/* 3. Share Name (Flexible Width) */}
                <div className="relative flex-grow w-full">
                    <input
                        value={shareName || ''}
                        onChange={(e) => setShareName?.(e.target.value)}
                        placeholder="Security name..."
                        autoComplete="off"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] outline-none focus:ring-2 ring-indigo-500"
                    />
                </div>

                {/* 4. Long Term Toggle - Conditional Rendering */}
                {showLongTermToggle && (
                    <div className="flex p-1 bg-slate-100 rounded-xl shrink-0 overflow-x-auto max-w-full">
                        <button
                            onClick={() => setLongTerm?.(true)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${longTerm === true
                                ? 'bg-white shadow-sm text-indigo-600'
                                : 'text-slate-500'
                                }`}
                        >
                            Long Term
                        </button>
                        <button
                            onClick={() => setLongTerm?.(false)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${longTerm === false
                                ? 'bg-white shadow-sm text-indigo-600'
                                : 'text-slate-500'
                                }`}
                        >
                            Short Term
                        </button>
                        {!showBalanceToggle && (
                            <button
                                onClick={() => setLongTerm?.('square_off')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${longTerm === 'square_off'
                                    ? 'bg-white shadow-sm text-indigo-600'
                                    : 'text-slate-500'
                                    }`}
                            >
                                Square Off
                            </button>
                        )}
                        <button
                            onClick={() => setLongTerm?.(null)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${longTerm === null
                                ? 'bg-white shadow-sm text-indigo-600'
                                : 'text-slate-500'
                                }`}
                        >
                            All
                        </button>
                    </div>
                )}

                {/* 5. Date Range */}
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-200 px-2 py-1.5 rounded-xl">
                    <Calendar size={12} className="text-slate-400" />
                    <input
                        type="date" value={startDate || ''}
                        autoComplete="off"
                        onChange={(e) => setStartDate?.(e.target.value)}
                        className="bg-transparent text-[10px] outline-none w-[95px]"
                    />
                    <span className="text-slate-300">-</span>
                    <input
                        type="date" value={endDate || ''}
                        autoComplete="off"
                        onChange={(e) => setEndDate?.(e.target.value)}
                        className="bg-transparent text-[10px] outline-none w-[95px]"
                    />
                </div>

                {/* 6. Balance Toggle - Conditional Rendering */}
                {showBalanceToggle && (
                    <div className="flex p-1 bg-slate-100 rounded-xl shrink-0">
                        <button
                            onClick={() => setShowAll?.(false)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${!showAll ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setShowAll?.(true)}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${showAll ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                        >
                            All
                        </button>
                    </div>
                )}

                {/* 7. Clear */}
                <button onClick={clearAll} className="p-2 text-slate-400 hover:text-red-500 shrink-0">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
}