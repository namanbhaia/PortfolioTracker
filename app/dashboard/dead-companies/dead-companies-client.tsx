"use client"

import React, { useState, useMemo, useTransition } from 'react';
import { Skull, Search, Save, RotateCcw, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { updateAssetsDeadAction } from '@/lib/actions/assets/toggle-dead';

/**
 * @file dead-companies-client.tsx
 * @description Client-side interactive table for marking tickers as dead/active.
 * Tracks pending changes in a local diff map and batch-saves via the server action.
 * Uses checkboxes in the Dead column for intuitive toggling.
 */

interface TickerRow {
    ticker: string;
    dead: boolean;
    stockName: string;
}

interface Props {
    initialTickers: TickerRow[];
}

export default function DeadCompaniesClient({ initialTickers }: Props) {
    // Local diff: ticker -> desired dead state (only entries that differ from initial)
    const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map());
    const [searchQuery, setSearchQuery] = useState('');
    const [filterState, setFilterState] = useState<'all' | 'dead' | 'active'>('all');
    const [isPending, startTransition] = useTransition();
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Merge initial state with local pending changes for display
    const mergedRows = useMemo(() => {
        return initialTickers.map((row) => ({
            ...row,
            dead: pendingChanges.has(row.ticker) ? pendingChanges.get(row.ticker)! : row.dead,
        }));
    }, [initialTickers, pendingChanges]);

    const filteredRows = useMemo(() => {
        return mergedRows.filter((row) => {
            const matchesSearch =
                row.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                row.stockName.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesFilter =
                filterState === 'all' ||
                (filterState === 'dead' && row.dead) ||
                (filterState === 'active' && !row.dead);

            return matchesSearch && matchesFilter;
        });
    }, [mergedRows, searchQuery, filterState]);

    const pendingCount = pendingChanges.size;
    const deadCount = mergedRows.filter((r) => r.dead).length;
    const activeCount = mergedRows.length - deadCount;

    function toggleRow(ticker: string, currentDead: boolean) {
        const original = initialTickers.find((r) => r.ticker === ticker)?.dead ?? false;
        const newState = !currentDead;

        setPendingChanges((prev) => {
            const next = new Map(prev);
            if (newState === original) {
                next.delete(ticker);
            } else {
                next.set(ticker, newState);
            }
            return next;
        });
    }

    function handleReset() {
        setPendingChanges(new Map());
    }

    function showToast(type: 'success' | 'error', message: string) {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    }

    function handleSave() {
        if (!pendingCount) return;

        const changes = Array.from(pendingChanges.entries()).map(([ticker, dead]) => ({ ticker, dead }));

        startTransition(async () => {
            try {
                await updateAssetsDeadAction(changes);
                setPendingChanges(new Map());
                showToast('success', `Saved ${changes.length} change${changes.length !== 1 ? 's' : ''} successfully.`);
            } catch (err: any) {
                showToast('error', err?.message ?? 'An unexpected error occurred.');
            }
        });
    }

    const filterButtons: { label: string; value: 'all' | 'dead' | 'active' }[] = [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Dead', value: 'dead' },
    ];

    return (
        <>
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium animate-in slide-in-from-bottom-4 fade-in duration-300 ${
                        toast.type === 'success'
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                    }`}
                >
                    {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {toast.message}
                </div>
            )}

            {/* Page Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Skull className="text-rose-500" size={30} />
                        Dead Companies
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                        Tick the checkbox to mark a ticker as dead. Save when done.
                    </p>
                </div>

                {/* Stats */}
                <div className="flex gap-3 shrink-0">
                    <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active</p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
                    </div>
                    <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-center">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Dead</p>
                        <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{deadCount}</p>
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-0 w-full sm:w-auto">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        id="dead-companies-search"
                        type="text"
                        placeholder="Search ticker or company…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 dark:focus:border-indigo-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    />
                </div>

                {/* Filter pills */}
                <div className="flex gap-1.5 shrink-0">
                    {filterButtons.map((btn) => (
                        <button
                            key={btn.value}
                            onClick={() => setFilterState(btn.value)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                                filterState === btn.value
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>

                {/* Save / Reset — only visible when there are unsaved changes */}
                {pendingCount > 0 && (
                    <div className="flex gap-2 shrink-0 ml-auto">
                        <button
                            onClick={handleReset}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 transition-all disabled:opacity-50"
                        >
                            <RotateCcw size={13} />
                            Reset
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm shadow-indigo-600/30 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isPending ? (
                                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={13} />
                            )}
                            Save {pendingCount} change{pendingCount !== 1 ? 's' : ''}
                        </button>
                    </div>
                )}
            </div>

            {/* Pending changes summary banner */}
            {pendingCount > 0 && (
                <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300 text-sm">
                    <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                    <div>
                        <span className="font-semibold">{pendingCount} unsaved change{pendingCount !== 1 ? 's' : ''}:</span>
                        <span className="ml-1 text-amber-600 dark:text-amber-400">
                            {Array.from(pendingChanges.entries())
                                .map(([t, d]) => `${t} → ${d ? 'dead' : 'active'}`)
                                .join(', ')}
                        </span>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                            <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-28">Ticker</th>
                            <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Company Name</th>
                            <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-24">Status</th>
                            {/* "Dead" checkbox column */}
                            <th className="text-center px-4 py-3 text-[11px] font-bold text-rose-400 uppercase tracking-widest w-20">Dead</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredRows.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm">
                                    No tickers match your search.
                                </td>
                            </tr>
                        ) : (
                            filteredRows.map((row) => {
                                const hasPendingChange = pendingChanges.has(row.ticker);
                                return (
                                    <tr
                                        key={row.ticker}
                                        onClick={() => !isPending && toggleRow(row.ticker, row.dead)}
                                        className={`cursor-pointer transition-colors ${
                                            hasPendingChange
                                                ? 'bg-amber-50/60 dark:bg-amber-900/10'
                                                : row.dead
                                                ? 'bg-rose-50/40 dark:bg-rose-900/5 hover:bg-rose-50/80 dark:hover:bg-rose-900/10'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                        }`}
                                    >
                                        {/* Ticker */}
                                        <td className="px-4 py-3">
                                            <span className={`font-mono font-bold tracking-wide ${row.dead ? 'text-rose-500 dark:text-rose-400 line-through' : 'text-slate-800 dark:text-slate-100'}`}>
                                                {row.ticker}
                                            </span>
                                            {hasPendingChange && (
                                                <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-amber-400 align-middle" title="Unsaved change" />
                                            )}
                                        </td>

                                        {/* Company name */}
                                        <td className={`px-4 py-3 truncate max-w-xs ${row.dead ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-600 dark:text-slate-300'}`}>
                                            {row.stockName}
                                        </td>

                                        {/* Status badge */}
                                        <td className="px-4 py-3 text-center">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                                    row.dead
                                                        ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400'
                                                        : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                }`}
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${row.dead ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                                {row.dead ? 'Dead' : 'Active'}
                                            </span>
                                        </td>

                                        {/* Dead checkbox */}
                                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                id={`dead-checkbox-${row.ticker}`}
                                                type="checkbox"
                                                checked={row.dead}
                                                disabled={isPending}
                                                onChange={() => toggleRow(row.ticker, row.dead)}
                                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-rose-500 focus:ring-rose-400 focus:ring-offset-0 cursor-pointer accent-rose-500 disabled:opacity-50"
                                            />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer note */}
            <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 font-medium uppercase tracking-widest">
                Changes are pending until saved • Restricted to Admins
            </p>
        </>
    );
}
