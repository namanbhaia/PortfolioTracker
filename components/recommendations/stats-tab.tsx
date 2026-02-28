"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, PieChart, Activity, AlertCircle, ShieldCheck } from "lucide-react";
import { getStatisticalSuggestions, ConcentrationAlert, VolatilityAlert } from '@/lib/actions/suggestions/statistical_suggestions';

export default function StatsTab({ holdings, transactions, clients }: { holdings: any[], transactions: any[], clients: any[] }) {
    const [concentration, setConcentration] = useState<ConcentrationAlert[]>([]);
    const [volatility, setVolatility] = useState<VolatilityAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await getStatisticalSuggestions(holdings);
                setConcentration(res.concentration);
                setVolatility(res.volatility);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [holdings]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Card className="bg-white border-slate-200 shadow-xl animate-pulse">
                    <CardHeader className="h-24 bg-slate-100 rounded-t-xl" />
                    <CardContent className="h-64" />
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Concentration Risk Card */}
                <Card className="bg-white border-slate-200 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-emerald-500" />
                            Asset Concentration Risk
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            Flags individual assets that make up more than 20% of your total portfolio value.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {concentration.length > 0 ? (
                            <div className="space-y-4">
                                {concentration.map((c, i) => (
                                    <div key={i} className="bg-white border border-emerald-200 shadow-sm rounded-xl p-4 flex gap-4">
                                        <div className="p-2 bg-emerald-50 rounded-full h-fit mt-1">
                                            <AlertCircle className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg">{c.ticker} <span className="text-sm font-normal text-slate-500 ml-2">{c.stock_name}</span></h4>
                                            <p className="text-emerald-600 font-medium my-1">{c.percentage.toFixed(1)}% of Portfolio</p>
                                            <p className="text-sm text-slate-600">{c.warning}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-xl border border-slate-200 border-dashed">
                                <ShieldCheck className="w-12 h-12 text-slate-400 mb-3" />
                                <h4 className="text-slate-900 font-medium">Well Diversified</h4>
                                <p className="text-sm text-slate-500 max-w-[250px] mt-1">No single asset exceeds 20% of your portfolio value. Great job maintaining diversification!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Volatility & Beta Card */}
                <Card className="bg-white border-slate-200 shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-xl text-slate-900 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-indigo-500" />
                            Volatility & Market Beta
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            Highlights extreme market sensitivity (Beta &gt; 1.5 or &lt; 0.5) among your top 10 holdings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {volatility.length > 0 ? (
                            <div className="space-y-4">
                                {volatility.map((v, i) => {
                                    const isHigh = v.beta > 1.5;
                                    const colorClass = isHigh ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-indigo-600 bg-indigo-50 border-indigo-200';
                                    const iconColor = isHigh ? 'text-rose-500' : 'text-indigo-500';

                                    return (
                                        <div key={i} className={`bg-white shadow-sm border rounded-xl p-4 flex gap-4 ${colorClass}`}>
                                            <div className="p-2 bg-white rounded-full shadow-sm h-fit mt-1">
                                                <Activity className={`w-5 h-5 ${iconColor}`} />
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-900 text-lg">{v.ticker}</h4>
                                                    <div className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">Beta: {v.beta.toFixed(2)}</div>
                                                </div>
                                                <p className="text-sm text-slate-600 mt-2">{v.warning}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-xl border border-slate-200 border-dashed">
                                <LineChart className="w-12 h-12 text-slate-400 mb-3" />
                                <h4 className="text-slate-900 font-medium">Standard Volatility</h4>
                                <p className="text-sm text-slate-500 max-w-[250px] mt-1">Your top holdings have typical market sensitivity (Beta between 0.5 and 1.5).</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
