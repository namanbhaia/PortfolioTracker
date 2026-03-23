"use client"
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus, Clock, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getStockSuggestions } from '@/lib/actions/suggestions/gemini_suggestions';

export default function GeminiTab({ holdings, transactions, clients }: { holdings: any[], transactions: any[], clients: any[] }) {
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            // Simplify data to reduce prompt size if needed, but passing directly for now.
            const result = await getStockSuggestions(transactions, holdings);
            if (result && result.length > 0) {
                setSuggestions(result);
            } else {
                setError("No actionable suggestions received from AI at this time.");
            }
        } catch (e: any) {
            console.error("AI Generation Error:", e);
            setError("Failed to generate insights. Please check server logs.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-indigo-400" />
                            AI-Powered Insights
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            Get personalized buy, sell, or hold recommendations based on your transaction history, current holdings, and general Indian market sentiment.
                        </CardDescription>
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing Portfolio...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate Insights
                            </>
                        )}
                    </Button>
                </CardHeader>
            </Card>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                    {error}
                </div>
            )}

            {suggestions.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {suggestions.map((suggestion, index) => {
                        const isBuy = suggestion.action === 'BUY';
                        const isSell = suggestion.action === 'SELL';

                        return (
                            <Card key={index} className="bg-white border-slate-200 overflow-hidden relative group hover:border-indigo-400 transition-colors shadow-sm hover:shadow-md">
                                <div className={`absolute top-0 left-0 w-1 h-full ${isBuy ? 'bg-emerald-500' : isSell ? 'bg-rose-500' : 'bg-slate-400'}`} />
                                <CardHeader className="pb-3 pl-6">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                                            {suggestion.symbol}
                                        </CardTitle>
                                        <div className={`px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1.5 ${isBuy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            isSell ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                            {isBuy && <TrendingUp className="h-3 w-3" />}
                                            {isSell && <TrendingDown className="h-3 w-3" />}
                                            {!isBuy && !isSell && <Minus className="h-3 w-3" />}
                                            {suggestion.action}
                                        </div>
                                    </div>
                                    {suggestion.targetPrice && (
                                        <div className="text-sm font-medium text-slate-400 mt-1">
                                            Target: ₹{suggestion.targetPrice.toLocaleString('en-IN')}
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="pl-6">
                                    <div className="text-sm text-slate-600 leading-relaxed mb-4">
                                        {suggestion.reasoning}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {suggestion.timeframe && (
                                            <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                                                <Clock className="w-3 h-3" />
                                                <span>{suggestion.timeframe}</span>
                                            </div>
                                        )}
                                        {suggestion.riskLevel && (
                                            <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                                                <ShieldAlert className="w-3 h-3" />
                                                <span>{suggestion.riskLevel} Risk</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 pt-4 border-t border-slate-100">
                                        <div className="flex justify-between text-xs text-slate-500 border-t-0 p-0 m-0">
                                            <span>AI Confidence</span>
                                            <span className="font-semibold text-slate-900">{Math.round(suggestion.confidence * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${suggestion.confidence > 0.8 ? 'bg-indigo-500' :
                                                    suggestion.confidence > 0.5 ? 'bg-indigo-400' : 'bg-indigo-300/50'
                                                    }`}
                                                style={{ width: `${suggestion.confidence * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
