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
                    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                    <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{description}</span>
                </div>
                <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-100/50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Asset</th>
                                <th scope="col" className="px-6 py-3 text-right">Qty</th>
                                <th scope="col" className="px-6 py-3 text-right">Loss Amount (₹)</th>
                                <th scope="col" className="px-6 py-3 text-right">Loss %</th>
                                <th scope="col" className="px-6 py-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, idx) => (
                                <tr key={idx} className="bg-white border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-800">
                                        <div className="flex flex-col">
                                            <span>{item.ticker}</span>
                                            <span className="text-xs text-slate-500 truncate max-w-[200px]">{item.stock_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">{item.balance_qty}</td>
                                    <td className="px-6 py-4 text-right text-rose-500 font-semibold flex items-center justify-end gap-1">
                                        <ArrowDownRight className="w-4 h-4" />
                                        {item.loss_amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 text-right text-rose-500/80">
                                        {item.loss_percent.toFixed(2)}%
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
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
            <Card className="bg-white border-slate-200 shadow-xl">
                <CardHeader>
                    <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                        <ReceiptText className="h-5 w-5 text-rose-500" />
                        Tax Loss Harvesting
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                        Identify opportunities to realize losses and offset capital gains tax liability for the Indian Market.
                    </CardDescription>
                </CardHeader>
                <CardContent>

                    {totalLoss > 0 ? (
                        <>
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 rounded-full">
                                    <AlertTriangle className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-indigo-600 font-medium">Potential Harvestable Loss</p>
                                    <p className="text-2xl font-bold text-slate-900">₹{totalLoss.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
                                    <p className="text-xs text-slate-500 mt-1">Selling these assets could help offset your capital gains tax.</p>
                                </div>
                            </div>

                            {renderTable(shortTerm, "Short-Term Losses", "STCG Offset (< 1 Year)")}
                            {renderTable(longTerm, "Long-Term Losses", "LTCG Offset (> 1 Year)")}
                        </>
                    ) : (
                        <div className="text-center py-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                                <ReceiptText className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 mb-1">No harvestable losses found</h3>
                            <p className="text-slate-500 text-sm max-w-md mx-auto">
                                All your active holdings are currently profitable or flat. You don't have any unrealized losses to offset gains.
                            </p>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
