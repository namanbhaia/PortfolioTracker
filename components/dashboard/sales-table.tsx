"use client"

import React, { useState, useMemo } from 'react';
import { 
    TrendingUp, 
    TrendingDown, 
    Search,
    ChevronDown,
    ChevronUp,
    Hash,
    Calendar
} from 'lucide-react';

interface SaleRecord {
    custom_id: string;
    trading_id: string;
    client_name: string;
    ticker: string;
    stock_name: string;
    purchase_date: string;
    purchase_qty: number;
    purchase_rate: number;
    sale_date: string;
    sale_qty: number;
    sale_rate: number;
    sale_value: number;
    profit: number;
    long_term: boolean;
    comments: string;
}

export default function SalesTable({ data }: { data: SaleRecord[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: keyof SaleRecord; direction: 'asc' | 'desc' } | null>({
        key: 'sale_date',
        direction: 'desc'
    });

    // Filtering & Sorting Logic
    const filteredAndSortedData = useMemo(() => {
        let result = [...data];

        // 1. Filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(item => 
                item.ticker.toLowerCase().includes(lowerSearch) ||
                item.client_name.toLowerCase().includes(lowerSearch) ||
                item.custom_id?.toLowerCase().includes(lowerSearch) ||
                item.stock_name?.toLowerCase().includes(lowerSearch)
            );
        }

        // 2. Sort
        if (sortConfig) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [data, searchTerm, sortConfig]);

    const requestSort = (key: keyof SaleRecord) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig?.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="w-full space-y-4">
            {/* Standardized Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between px-1">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by ticker, client, or custom ID..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 ring-indigo-500/20 outline-none transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Showing {filteredAndSortedData.length} Transactions
                </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-medium">
                            <th className="px-4 py-3 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('ticker')}>
                                <div className="flex items-center gap-1">Asset / Client {sortConfig?.key === 'ticker' && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                            </th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => requestSort('sale_date')}>
                                Sale Details
                            </th>
                            <th className="px-4 py-3 text-right">Qty (Sold/Batch)</th>
                            <th className="px-4 py-3 text-right">Rates (Sale/Buy)</th>
                            <th className="px-4 py-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => requestSort('profit')}>
                                <div className="flex items-center justify-end gap-1">Realized P&L {sortConfig?.key === 'profit' && (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>)}</div>
                            </th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">ID / Notes</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAndSortedData.map((row, idx) => {
                            const isProfit = row.profit >= 0;
                            const roi = (row.profit / (row.purchase_rate * row.sale_qty)) * 100;

                            return (
                                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-4 py-4">
                                        <div className="font-bold text-slate-900">{row.ticker}</div>
                                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                            <span className="uppercase tracking-wider font-semibold text-indigo-600">{row.client_name}</span>
                                            <span>• {row.trading_id}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="text-slate-900 font-medium">{new Date(row.sale_date).toLocaleDateString('en-IN')}</div>
                                        <div className="text-[10px] text-slate-400">Bought {new Date(row.purchase_date).toLocaleDateString('en-IN')}</div>
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono">
                                        <div className="text-slate-900 font-bold">{row.sale_qty}</div>
                                        <div className="text-[10px] text-slate-400">of {row.purchase_qty} lot</div>
                                    </td>
                                    <td className="px-4 py-4 text-right font-mono">
                                        <div className="text-slate-900">₹{row.sale_rate.toLocaleString('en-IN')}</div>
                                        <div className="text-[10px] text-slate-400">Cost: ₹{row.purchase_rate.toLocaleString('en-IN')}</div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className={`font-bold flex items-center justify-end gap-1 ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            ₹{Math.abs(row.profit).toLocaleString('en-IN')}
                                        </div>
                                        <div className={`text-[10px] ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {isProfit ? '+' : ''}{roi.toFixed(2)}% ROI
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${
                                            row.long_term ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                        }`}>
                                            {row.long_term ? 'Long Term' : 'Short Term'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {row.custom_id && (
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 mb-1">
                                                <Hash size={10} /> {row.custom_id}
                                            </div>
                                        )}
                                        <div className="text-[11px] text-slate-500 italic max-w-[150px] truncate" title={row.comments}>
                                            {row.comments || "--"}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}