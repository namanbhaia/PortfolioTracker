"use client"

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, MoreHorizontal, ReceiptIndianRupee } from 'lucide-react';
import { SaleModal } from '@/components/forms/sale-modal';
import { calculateHoldingsStats, isLongTerm } from '@/lib/calculations';

interface Holding {
    trx_id: string;
    client_name: string;
    ticker: string;
    stock_name: string;
    purchase_date: string;
    purchase_qty: number;
    purchase_rate: number;
    sold_qty: number;
    balance_qty: number;
    market_rate: number; // In a real app, this comes from an API
}

export default function HoldingsTable({ holdings }: { holdings: Holding[] }) {
    const [selectedPurchase, setSelectedPurchase] = useState<Holding | null>(null);

    return (
        <div className="w-full">
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-medium">
                            <th className="px-4 py-3">Asset / Client</th>
                            <th className="px-4 py-3 text-right">Balance Qty</th>
                            <th className="px-4 py-3 text-right">Avg. Cost</th>
                            <th className="px-4 py-3 text-right">Market Price</th>
                            <th className="px-4 py-3 text-right">Market Value</th>
                            <th className="px-4 py-3 text-right">Unrealized P&L</th>
                            <th className="px-4 py-3">Tax Status</th>
                            <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {holdings.map((row) => {
                            const { marketValue, unrealizedProfit, profitPercentage } =
                                calculateHoldingsStats(row.purchase_rate, row.market_rate, row.balance_qty);

                            const isLTCG = isLongTerm(new Date(row.purchase_date));
                            const isProfit = unrealizedProfit >= 0;

                            return (
                                <tr key={row.trx_id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-4 py-4">
                                        <div className="font-bold text-slate-900">{row.ticker}</div>
                                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                            <span className="uppercase tracking-wider font-semibold">{row.client_name}</span>
                                            <span>• Bought {new Date(row.purchase_date).toLocaleDateString('en-IN')}</span>
                                        </div>
                                    </td>

                                    <td className="px-4 py-4 text-right font-mono text-slate-600">
                                        {row.balance_qty}
                                    </td>

                                    <td className="px-4 py-4 text-right font-mono text-slate-600">
                                        ₹{row.purchase_rate.toLocaleString('en-IN')}
                                    </td>

                                    <td className="px-4 py-4 text-right font-mono text-slate-900 font-medium">
                                        ₹{row.market_rate.toLocaleString('en-IN')}
                                    </td>

                                    <td className="px-4 py-4 text-right font-mono text-slate-900 font-medium">
                                        ₹{row.market_value.toLocaleString('en-IN')}
                                    </td>

                                    <td className="px-4 py-4 text-right">
                                        <div className={`font-bold flex items-center justify-end gap-1 ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {isProfit ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            ₹{Math.abs(unrealizedProfit).toLocaleString('en-IN')}
                                        </div>
                                        <div className={`text-[11px] ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {isProfit ? '+' : '-'}{Math.abs(profitPercentage).toFixed(2)}%
                                        </div>
                                    </td>

                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${isLTCG ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                            }`}>
                                            {isLTCG ? 'Long Term' : 'Short Term'}
                                        </span>
                                    </td>

                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={() => setSelectedPurchase(row)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                                        >
                                            <ReceiptIndianRupee size={14} />
                                            Sell
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Logic to handle the modal opening/closing */}
            {selectedPurchase && (
                <SaleModal
                    purchase={selectedPurchase}
                    isOpen={!!selectedPurchase}
                    onClose={() => setSelectedPurchase(null)}
                />
            )}
        </div>
    );
}