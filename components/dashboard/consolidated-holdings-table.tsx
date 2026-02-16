"use client"

import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import TickerCell from '@/components/ui/ticker-cell';

type SortConfig = {
    key: 'ticker' | 'stock_name' | 'total_market_value' | 'pl' | 'pl_percent' | 'total_pledged';
    direction: 'asc' | 'desc';
} | null;

export default function ConsolidatedHoldingsTable({ consolidatedRows }: { consolidatedRows: any[] }) {
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

    const requestSort = (key: 'ticker' | 'stock_name' | 'total_market_value' | 'pl' | 'pl_percent' | 'total_pledged') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig?.key !== column) return <ArrowUpDown size={12} className="ml-1 opacity-50" />;
        return sortConfig.direction === 'asc'
            ? <ChevronUp size={12} className="ml-1 text-indigo-600" />
            : <ChevronDown size={12} className="ml-1 text-indigo-600" />;
    };

    return (
        <table className="w-full text-left text-[11px] border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase">
                <tr>

                    <th className="px-4 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('ticker')}>
                        <div className="flex items-center">Ticker / ISIN <SortIcon column="ticker" /></div>
                    </th>
                    <th className="px-4 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('stock_name')}>
                        <div className="flex items-center">Stock Name <SortIcon column="stock_name" /></div>
                    </th>
                    <th className="px-4 py-4 text-right">Qty</th>
                    <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('total_pledged')}>
                        <div className="flex items-center justify-end">Pledged <SortIcon column="total_pledged" /></div>
                    </th>
                    <th className="px-4 py-4 text-right">Avg. Price</th>
                    <th className="px-4 py-4 text-right">Purchase Val</th>
                    <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('total_market_value')}>
                        <div className="flex items-center justify-end">Market Val <SortIcon column="total_market_value" /></div>
                    </th>
                    <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('pl')}>
                        <div className="flex items-center justify-end">P/L <SortIcon column="pl" /></div>
                    </th>
                    <th className="px-4 py-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('pl_percent')}>
                        <div className="flex items-center justify-end">P/L % <SortIcon column="pl_percent" /></div>
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {sortedData.map((row) => (
                    <tr key={row.ticker} className="hover:bg-slate-50/80 transition-colors">
                        <TickerCell ticker={row.ticker} isin={row.isin} />
                        <td className="px-4 py-4 font-medium text-slate-700">{row.stock_name}</td>
                        <td className="px-4 py-4 text-right font-mono">{row.total_qty}</td>
                        <td className="px-4 py-4 text-right font-mono text-amber-600 font-bold">{row.total_pledged || '-'}</td>
                        <td className="px-4 py-4 text-right font-mono">₹{row.avg_purchase_price.toFixed(2)}</td>
                        <td className="px-4 py-4 text-right font-semibold">₹{row.total_purchase_value.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-right font-bold text-slate-900">₹{row.total_market_value.toLocaleString('en-IN')}</td>
                        <td className={`px-4 py-4 text-right font-bold ${row.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{row.pl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className={`px-4 py-4 text-right font-bold ${row.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {row.pl_percent.toFixed(2)}%
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
