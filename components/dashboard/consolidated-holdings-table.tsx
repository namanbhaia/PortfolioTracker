"use client"

import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ChevronUp, ChevronDown, Settings2 } from 'lucide-react';
import TickerCell from '@/components/tables/ticker-cell';

export const consolidated_columns = [
    { id: 'ticker', label: 'Ticker / ISIN' },
    { id: 'stock_name', label: 'Stock Name' },
    { id: 'total_qty', label: 'Qty' },
    { id: 'total_pledged', label: 'Pledged' },
    { id: 'avg_purchase_price', label: 'Avg. Price' },
    { id: 'total_purchase_value', label: 'Purchase Val' },
    { id: 'total_market_value', label: 'Market Val' },
    { id: 'beta', label: 'Beta' },
    { id: 'trailing_pe', label: 'P/E' },
    { id: 'eps', label: 'EPS' },
    { id: 'today_range', label: 'Day Range' },
    { id: 'pl', label: 'P/L' },
];

/**
 * @file consolidated-holdings-table.tsx
 * @description Renders a sortable table showing aggregated holdings across all selected clients.
 */

type SortConfig = {
    key: 'ticker' | 'stock_name' | 'total_market_value' | 'pl' | 'pl_percent' | 'total_pledged' | 'beta' | 'trailing_pe' | 'eps';
    direction: 'asc' | 'desc';
} | null;

/**
 * Component for displaying consolidated holdings data with sorting capabilities.
 * @param {Object} props - Component props.
 * @param {any[]} props.consolidatedRows - The aggregated holdings data to display.
 * @param {(id: string) => boolean} props.isVisible - Function to check if a column is visible.
 */
export default function ConsolidatedHoldingsTable({ consolidatedRows, isVisible }: { consolidatedRows: any[], isVisible: (id: string) => boolean }) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'ticker', direction: 'asc' });

    // Handle sorting logic
    const sortedData = useMemo(() => {
        let sortableItems = [...consolidatedRows];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                // Handle string comparisons
                if (typeof aValue === 'string') {
                    return sortConfig.direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }

                // Handle numeric comparisons
                return sortConfig.direction === 'asc'
                    ? (aValue as number) - (bValue as number)
                    : (bValue as number) - (aValue as number);
            });
        }
        return sortableItems;
    }, [consolidatedRows, sortConfig]);

    const requestSort = (key: 'ticker' | 'stock_name' | 'total_market_value' | 'pl' | 'pl_percent' | 'total_pledged' | 'beta' | 'trailing_pe' | 'eps') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown size={12} className="ml-1 opacity-50 transition-colors" />;
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={12} className="ml-1 text-indigo-600 dark:text-indigo-400 transition-colors" />
            : <ChevronDown size={12} className="ml-1 text-indigo-600 dark:text-indigo-400 transition-colors" />;
    };

    return (
        <div className="overflow-x-auto overflow-y-auto w-full h-[calc(100vh-400px)] relative">
            <table className="w-full text-left text-[11px] border-collapse min-w-[1200px]">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-400 font-bold uppercase transition-colors sticky top-0 z-20 shadow-sm">
                    <tr>
                        {isVisible('ticker') && (
                            <th className="px-4 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('ticker')}>
                                <div className="flex items-center">Ticker / ISIN <SortIcon column="ticker" /></div>
                            </th>
                        )}
                        {isVisible('stock_name') && (
                            <th className="px-4 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('stock_name')}>
                                <div className="flex items-center">Stock Name <SortIcon column="stock_name" /></div>
                            </th>
                        )}
                        {isVisible('total_qty') && <th className="px-4 py-4 text-right">Qty</th>}
                        {isVisible('total_pledged') && (
                            <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('total_pledged')}>
                                <div className="flex items-center justify-end">Pledged <SortIcon column="total_pledged" /></div>
                            </th>
                        )}
                        {isVisible('avg_purchase_price') && <th className="px-4 py-4 text-right">Avg. Price</th>}
                        {isVisible('total_purchase_value') && <th className="px-4 py-4 text-right">Purchase Val</th>}
                        {isVisible('total_market_value') && (
                            <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('total_market_value')}>
                                <div className="flex items-center justify-end">Market Val <SortIcon column="total_market_value" /></div>
                            </th>
                        )}
                        {isVisible('beta') && (
                            <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('beta')}>
                                <div className="flex items-center justify-end">Beta <SortIcon column="beta" /></div>
                            </th>
                        )}
                        {isVisible('trailing_pe') && (
                            <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('trailing_pe')}>
                                <div className="flex items-center justify-end">P/E <SortIcon column="trailing_pe" /></div>
                            </th>
                        )}
                        {isVisible('eps') && (
                            <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('eps')}>
                                <div className="flex items-center justify-end">EPS <SortIcon column="eps" /></div>
                            </th>
                        )}
                        {isVisible('today_range') && <th className="px-4 py-4 text-right transition-colors">Day Range</th>}
                        {isVisible('pl') && (
                            <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('pl')}>
                                <div className="flex items-center justify-end">P/L <SortIcon column="pl" /></div>
                            </th>
                        )}
                        {isVisible('pl_percent') && (
                            <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => requestSort('pl_percent')}>
                                <div className="flex items-center justify-end">P/L % <SortIcon column="pl_percent" /></div>
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedData.map((row) => (
                        <tr key={row.ticker} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                            {isVisible('ticker') && <TickerCell ticker={row.ticker} isin={row.isin} />}
                            {isVisible('stock_name') && <td className="px-4 py-4 font-medium text-slate-700 dark:text-slate-300">{row.stock_name}</td>}
                            {isVisible('total_qty') && <td className="px-4 py-4 text-right font-mono text-slate-700 dark:text-slate-300">{row.total_qty}</td>}
                            {isVisible('total_pledged') && <td className="px-4 py-4 text-right font-mono text-amber-600 dark:text-amber-500 font-bold">{row.total_pledged || '-'}</td>}
                            {isVisible('avg_purchase_price') && <td className="px-4 py-4 text-right font-mono text-slate-600 dark:text-slate-400">₹{row.avg_purchase_price.toFixed(2)}</td>}
                            {isVisible('total_purchase_value') && <td className="px-4 py-4 text-right font-semibold text-slate-700 dark:text-slate-300">₹{row.total_purchase_value.toLocaleString('en-IN')}</td>}
                            {isVisible('total_market_value') && <td className="px-4 py-4 text-right font-bold text-slate-900 dark:text-white">₹{row.total_market_value.toLocaleString('en-IN')}</td>}
                            {isVisible('beta') && <td className="px-4 py-4 text-right font-mono text-slate-500 dark:text-slate-400">{row.beta?.toFixed(2) || '-'}</td>}
                            {isVisible('trailing_pe') && <td className="px-4 py-4 text-right font-mono text-slate-500 dark:text-slate-400">{row.trailing_pe?.toFixed(2) || '-'}</td>}
                            {isVisible('eps') && <td className="px-4 py-4 text-right font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{row.eps?.toFixed(2) || '-'}</td>}
                            {isVisible('today_range') && (
                                <td className="px-4 py-4 text-right font-mono text-[10px] text-slate-500 dark:text-slate-400">
                                    {row.today_low && row.today_high ? `₹${row.today_low.toFixed(1)} - ${row.today_high.toFixed(1)}` : '-'}
                                </td>
                            )}
                            {isVisible('pl') && (
                                <td className={`px-4 py-4 text-right font-bold ${row.pl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    ₹{row.pl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </td>
                            )}
                            {isVisible('pl_percent') && (
                                <td className={`px-4 py-4 text-right font-bold ${row.pl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {row.pl_percent.toFixed(2)}%
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
