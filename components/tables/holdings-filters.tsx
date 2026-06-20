"use client";

/**
 * @file holdings-filters.tsx
 * @description A comprehensive filter bar for refining the display of holdings and sales data.
 */

import React, { useState, useEffect } from 'react';
import { Search, Calendar, X, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ClientMultiSelect } from './client-filter';

/**
 * Component providing a suite of filters (ticker, date, term, etc.) for portfolio data.
 * @param {Object} props - Component props.
 */
export default function HoldingsFilter({
    availableClients,
    showLongTermToggle = true,
    showBalanceToggle = true,
    showPledgedToggle = false,
    showDateFilter = true,
    showDeadToggle = false,

    ticker: controlledTicker, setTicker,
    shareName: controlledShareName, setShareName,
    startDate: controlledStartDate, setStartDate,
    endDate: controlledEndDate, setEndDate,
    showAll: controlledShowAll, setShowAll,
    longTerm: controlledLongTerm, setLongTerm,
    pledgedOnly: controlledPledgedOnly, setPledgedOnly,
    showDead: controlledShowDead, setShowDead,
    selectedClientIds: controlledClientIds, setSelectedClientIds,
    onSubmit,
    onClear,
    resetPath
}: {
    availableClients: Record<string, any>[],
    showLongTermToggle?: boolean,
    showBalanceToggle?: boolean,
    showPledgedToggle?: boolean,
    showDateFilter?: boolean,
    showDeadToggle?: boolean,

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
    pledgedOnly?: boolean,
    setPledgedOnly?: (val: boolean) => void,
    showDead?: boolean,
    setShowDead?: (val: boolean) => void,
    selectedClientIds?: string[],
    setSelectedClientIds?: (val: string[]) => void,
    onSubmit?: (e: React.FormEvent) => void,
    onClear?: () => void,
    resetPath?: string
}) {
    const router = useRouter();
    // Internal state for uncontrolled usage
    const [localTicker, setLocalTicker] = useState(controlledTicker || '');
    const [localShareName, setLocalShareName] = useState(controlledShareName || '');
    const [localStartDate, setLocalStartDate] = useState(controlledStartDate || '');
    const [localEndDate, setLocalEndDate] = useState(controlledEndDate || '');
    const [localShowAll, setLocalShowAll] = useState(controlledShowAll || false);
    const [localLongTerm, setLocalLongTerm] = useState<boolean | null | 'square_off'>(controlledLongTerm || null);
    const [localPledgedOnly, setLocalPledgedOnly] = useState(controlledPledgedOnly || false);
    const [localShowDead, setLocalShowDead] = useState(controlledShowDead || false);
    const [localClientIds, setLocalClientIds] = useState(controlledClientIds || []);

    // Sync local state if props change (for controlled usage)
    useEffect(() => { if (controlledTicker !== undefined) setLocalTicker(controlledTicker); }, [controlledTicker]);
    useEffect(() => { if (controlledShareName !== undefined) setLocalShareName(controlledShareName); }, [controlledShareName]);
    useEffect(() => { if (controlledStartDate !== undefined) setLocalStartDate(controlledStartDate); }, [controlledStartDate]);
    useEffect(() => { if (controlledEndDate !== undefined) setLocalEndDate(controlledEndDate); }, [controlledEndDate]);
    useEffect(() => { if (controlledShowAll !== undefined) setLocalShowAll(controlledShowAll); }, [controlledShowAll]);
    useEffect(() => { if (controlledLongTerm !== undefined) setLocalLongTerm(controlledLongTerm); }, [controlledLongTerm]);
    useEffect(() => { if (controlledPledgedOnly !== undefined) setLocalPledgedOnly(controlledPledgedOnly); }, [controlledPledgedOnly]);
    useEffect(() => { if (controlledShowDead !== undefined) setLocalShowDead(controlledShowDead); }, [controlledShowDead]);
    useEffect(() => { if (controlledClientIds !== undefined) setLocalClientIds(controlledClientIds); }, [controlledClientIds]);

    const handleClientChange = (id: string) => {
        const next = localClientIds.includes(id)
            ? localClientIds.filter(cid => cid !== id)
            : [...localClientIds, id];

        setLocalClientIds(next);
        setSelectedClientIds?.(next);
    };

    const clearAll = () => {
        setLocalTicker(''); setTicker?.('');
        setLocalShareName(''); setShareName?.('');
        setLocalStartDate(''); setStartDate?.('');
        setLocalEndDate(''); setEndDate?.('');
        setLocalShowAll(false); setShowAll?.(false);
        setLocalLongTerm(null); setLongTerm?.(null);
        setLocalPledgedOnly(false); setPledgedOnly?.(false);
        setLocalShowDead(false); setShowDead?.(false);
        setLocalClientIds([]); setSelectedClientIds?.([]);

        if (resetPath) {
            router.push(resetPath);
        }
        onClear?.();
    };

    const content = (
        <div className="flex flex-row flex-wrap items-center gap-2 lg:gap-3">
            {/* 0. Hidden Inputs for form submission (client_ids) */}
            <input type="hidden" name="client_ids" value={localClientIds.join(',')} />
            <input type="hidden" name="long_term" value={localLongTerm === null ? '' : String(localLongTerm)} />
            <input type="hidden" name="show_all" value={String(localShowAll)} />
            <input type="hidden" name="show_dead" value={String(localShowDead)} />

            {/* 1. Client Filter - Fixed Narrow Width */}
            <ClientMultiSelect
                clients={availableClients}
                selectedKeys={localClientIds}
                onChange={handleClientChange}
                identifier="client_id"
                className="w-full sm:w-64 lg:w-48 shrink-0"
            />

            {/* 2. Ticker */}
            <div className="relative w-full sm:w-32 lg:w-40 shrink-0">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input
                    name="ticker"
                    value={localTicker}
                    onChange={(e) => { setLocalTicker(e.target.value); setTicker?.(e.target.value); }}
                    placeholder="Ticker"
                    autoComplete="off"
                    className="w-full pl-8 pr-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] outline-none focus:ring-2 ring-indigo-500 transition-all dark:text-white dark:placeholder-slate-500 uppercase"
                />
            </div>

            {/* 3. Share Name (Flexible Width) */}
            <div className="relative flex-grow min-w-[200px] w-full lg:w-auto">
                <input
                    name="share_name"
                    value={localShareName}
                    onChange={(e) => { setLocalShareName(e.target.value); setShareName?.(e.target.value); }}
                    placeholder="Security name..."
                    autoComplete="off"
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] outline-none focus:ring-2 ring-indigo-500 transition-all dark:text-white dark:placeholder-slate-500"
                />
            </div>

            {/* 4. Long Term Toggle - Conditional Rendering */}
            {showLongTermToggle && (
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0 overflow-x-auto max-w-full">
                    <button
                        type="button"
                        onClick={() => { setLocalLongTerm(true); setLongTerm?.(true); }}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${localLongTerm === true
                            ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        Long Term
                    </button>
                    <button
                        type="button"
                        onClick={() => { setLocalLongTerm(false); setLongTerm?.(false); }}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${localLongTerm === false
                            ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        Short Term
                    </button>
                    {!showBalanceToggle && (
                        <button
                            type="button"
                            onClick={() => { setLocalLongTerm('square_off'); setLongTerm?.('square_off'); }}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${localLongTerm === 'square_off'
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-500 dark:text-slate-400'
                                }`}
                        >
                            Square Off
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => { setLocalLongTerm(null); setLongTerm?.(null); }}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${localLongTerm === null
                            ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        All
                    </button>
                </div>
            )}

            {/* 5. Date Range */}
            {showDateFilter && (
                <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1.5 rounded-xl">
                    <Calendar size={12} className="text-slate-400 dark:text-slate-500" />
                    <input
                        name="start_date"
                        type="date" value={localStartDate}
                        autoComplete="off"
                        onChange={(e) => { setLocalStartDate(e.target.value); setStartDate?.(e.target.value); }}
                        className="bg-transparent text-[10px] outline-none w-[95px] dark:text-white dark:[color-scheme:dark]"
                    />
                    <span className="text-slate-300 dark:text-slate-700">-</span>
                    <input
                        name="end_date"
                        type="date" value={localEndDate}
                        autoComplete="off"
                        onChange={(e) => { setLocalEndDate(e.target.value); setEndDate?.(e.target.value); }}
                        className="bg-transparent text-[10px] outline-none w-[95px] dark:text-white dark:[color-scheme:dark]"
                    />
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2 shrink-0 ml-auto">
                {/* Balance Toggle - Conditional Rendering */}
                {showBalanceToggle && (
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
                        <button
                            type="button"
                            onClick={() => { setLocalShowAll(false); setShowAll?.(false); }}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${!localShowAll 
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
                                : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            Active
                        </button>
                        <button
                            type="button"
                            onClick={() => { setLocalShowAll(true); setShowAll?.(true); }}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${localShowAll 
                                ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' 
                                : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            All
                        </button>
                    </div>
                )}

                {/* Pledged Only Toggle */}
                {showPledgedToggle && (
                    <button
                        type="button"
                        onClick={() => { 
                            const next = !localPledgedOnly;
                            setLocalPledgedOnly(next); 
                            setPledgedOnly?.(next); 
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all border shrink-0 ${localPledgedOnly
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                    >
                        <Lock size={12} className={localPledgedOnly ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                        Pledged
                    </button>
                )}

                {/* Show Dead Toggle */}
                {showDeadToggle && (
                    <button
                        type="button"
                        onClick={() => {
                            const next = !localShowDead;
                            setLocalShowDead(next);
                            setShowDead?.(next);
                        }}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all border shrink-0 ${localShowDead
                            ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                    >
                        Show Dead
                    </button>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white text-[11px] font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        Search
                    </button>
                    <button
                        type="button"
                        onClick={clearAll}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            {onSubmit ? (
                <form onSubmit={onSubmit}>
                    {content}
                </form>
            ) : content}
        </div>
    );
}