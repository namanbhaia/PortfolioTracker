"use client"

import React from 'react';
import { Calendar, ArrowRightLeft, Tag } from 'lucide-react';

export default function SalesTable({ data }: { data: any[] }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                            <th className="px-4 py-3 min-w-[150px]">Asset & Client</th>
                            <th className="px-4 py-3 bg-blue-50/30">Purchase Details</th>
                            <th className="px-4 py-3 bg-indigo-50/30">Sale Details</th>
                            <th className="px-4 py-3 text-right">Profit (INR)</th>
                            <th className="px-4 py-3 text-center">Tax Info</th>
                            <th className="px-4 py-3">Comments</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((row) => (
                            <tr key={row.trx_id} className="hover:bg-slate-50 transition-colors">
                                {/* Asset & Client */}
                                <td className="px-4 py-4">
                                    <div className="font-bold text-slate-900">{row.ticker}</div>
                                    <div className="text-slate-500">{row.stock_name}</div>
                                    <div className="mt-1 text-[10px] font-bold text-indigo-600 uppercase">
                                        {row.client_name} ({row.trading_id})
                                    </div>
                                </td>

                                {/* Purchase Details (The "In" side) */}
                                <td className="px-4 py-4 bg-blue-50/10">
                                    <div className="flex flex-col">
                                        <span>Date: {new Date(row.purchase_date).toLocaleDateString('en-IN')}</span>
                                        <span>Qty: <span className="font-mono">{row.sale_qty}</span></span>
                                        <span>Rate: <span className="font-mono">₹{row.purchase_rate}</span></span>
                                        <span className="font-semibold text-slate-700">Val: ₹{row.purchase_value.toLocaleString()}</span>
                                    </div>
                                </td>

                                {/* Sale Details (The "Out" side) */}
                                <td className="px-4 py-4 bg-indigo-50/10">
                                    <div className="flex flex-col">
                                        <span>Date: {new Date(row.sale_date).toLocaleDateString('en-IN')}</span>
                                        <span>Rate: <span className="font-mono">₹{row.sale_rate}</span></span>
                                        <span className="font-semibold text-slate-700">Val: ₹{row.sale_value.toLocaleString()}</span>
                                    </div>
                                </td>

                                {/* Profit/Loss */}
                                <td className="px-4 py-4 text-right">
                                    <div className={`text-sm font-bold ${row.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {row.profit >= 0 ? '+' : ''}₹{row.profit.toLocaleString()}
                                    </div>
                                    {row.long_term && <div className="text-[10px] text-slate-400">Grandfathered Profit: ₹{row.cutoff_profit || 0}</div>}
                                </td>

                                {/* Tax Logic */}
                                <td className="px-4 py-4 text-center">
                                    <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border mb-1 ${row.long_term ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-orange-50 border-orange-200 text-orange-700'
                                        }`}>
                                        {row.long_term ? 'LTCG (12.5%)' : 'STCG (20%)'}
                                    </div>
                                    <div className="text-[11px] font-bold text-slate-900">Tax: ₹{row.tax_payable.toLocaleString()}</div>
                                </td>

                                {/* Comments & ISIN */}
                                <td className="px-4 py-4 text-slate-500 italic max-w-[200px] truncate">
                                    <div className="text-[10px] not-italic text-slate-400 mb-1">ISIN: {row.isin}</div>
                                    {row.comments || "--"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}