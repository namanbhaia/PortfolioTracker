"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReceiptText, AlertTriangle, ArrowDownRight } from "lucide-react";
import { getTaxLossHarvestingSuggestions, TaxLossSuggestion } from '@/lib/actions/suggestions/tax_loss_harvesting_suggestions';
import { Button } from "@/components/ui/button";

export default function TaxLossTab({ holdings, transactions, clients }: { holdings: any[], transactions: any[], clients: any[] }) {
    const [shortTerm, setShortTerm] = useState<TaxLossSuggestion[]>([]);
    const [longTerm, setLongTerm] = useState<TaxLossSuggestion[]>([]);
    const [totalLoss, setTotalLoss] = useState(0);

    useEffect(() => {
        const fetchSuggestions = async () => {
            const result = await getTaxLossHarvestingSuggestions(holdings);
            setShortTerm(result.shortTerm);
            setLongTerm(result.longTerm);
            setTotalLoss(result.totalLossVal);
        };
        fetchSuggestions();
    }, [holdings]);

    const renderTable = (data: TaxLossSuggestion[], title: string, description: string) => {
        if (data.length === 0) return null;

        return (
            <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-white transition-colors">{title}</h3>
                    <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md transition-colors">{description}</span>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                    <table className="w-full text-sm text-left text-slate-600 dark:text-slate-400">
                        <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-100/50 dark:bg-slate-800/50 transition-colors">
                            <tr>
                                <th scope="col" className="px-6 py-3">Asset</th>
                                <th scope="col" className="px-6 py-3 text-right">Purchase Date</th>
                                <th scope="col" className="px-6 py-3 text-right">Qty</th>
                                <th scope="col" className="px-6 py-3 text-right">Loss Amount (₹)</th>
                                <th scope="col" className="px-6 py-3 text-right">Loss %</th>
                                <th scope="col" className="px-6 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {data.map((item, idx) => (
                                <tr key={idx} className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">
                                        <div className="flex flex-col">
                                            <span>{item.ticker}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{item.stock_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400">
                                        {new Date(item.purchase_date).toLocaleDateString('en-IN', { timeZone: 'UTC' })}
                                    </td>
                                    <td className="px-6 py-4 text-right">{item.balance_qty}</td>
                                    <td className="px-6 py-4 text-right text-rose-500 dark:text-rose-400 font-semibold flex items-center justify-end gap-1">
                                        <ArrowDownRight className="w-4 h-4" />
                                        {item.loss_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right text-rose-500/80 dark:text-rose-400/80">
                                        {item.loss_percent.toFixed(2)}%
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors">
                                            Info Only
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
                <CardHeader>
                    <CardTitle className="text-xl text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                        <ReceiptText className="h-5 w-5 text-rose-500" />
                        Tax Loss Harvesting
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400 transition-colors">
                        Identify opportunities to realize losses and offset capital gains tax liability for the Indian Market.
                    </CardDescription>
                </CardHeader>
                <CardContent>

                    {totalLoss > 0 ? (
                        <>
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl p-4 flex items-center gap-4 transition-colors">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-800/50 rounded-full transition-colors">
                                    <AlertTriangle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium transition-colors">Potential Harvestable Loss</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">₹{totalLoss.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 transition-colors">Selling these assets could help offset your capital gains tax.</p>
                                </div>
                            </div>

                            {renderTable(shortTerm, "Short-Term Losses", "STCG Offset (< 1 Year)")}
                            {renderTable(longTerm, "Long-Term Losses", "LTCG Offset (> 1 Year)")}
                        </>
                    ) : (
                        <div className="text-center py-10 transition-colors">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 transition-colors">
                                <ReceiptText className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1 transition-colors">No harvestable losses found</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto transition-colors">
                                All your active holdings are currently profitable or flat. You don't have any unrealized losses to offset gains.
                            </p>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
