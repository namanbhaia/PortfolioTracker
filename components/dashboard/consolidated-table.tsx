"use client"

import { PieChart, Users } from 'lucide-react';

export default function ConsolidatedTable({ data }) {
    const grandTotal = data.reduce((sum, item) => sum + item.total_market_value, 0);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                    <tr>
                        <th className="px-6 py-4">Ticker</th>
                        <th className="px-6 py-4 text-right">Total Qty</th>
                        <th className="px-6 py-4 text-right">Avg Rate</th>
                        <th className="px-6 py-4 text-right">Market Value</th>
                        <th className="px-6 py-4 text-right">% of Selection</th>
                        <th className="px-6 py-4">Accounts</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.sort((a, b) => b.total_market_value - a.total_market_value).map((row) => (
                        <tr key={row.ticker} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-bold text-slate-900">{row.ticker}</div>
                                <div className="text-[11px] text-slate-400">{row.stock_name}</div>
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-medium">{row.total_qty}</td>
                            <td className="px-6 py-4 text-right font-mono text-slate-600">₹{row.avg_rate.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">₹{row.total_market_value.toLocaleString('en-IN')}</td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <span className="text-xs font-bold text-slate-500">
                                        {((row.total_market_value / grandTotal) * 100).toFixed(1)}%
                                    </span>
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500"
                                            style={{ width: `${(row.total_market_value / grandTotal) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                    {row.held_by.map(client => (
                                        <span key={client} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">
                                            {client}
                                        </span>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}