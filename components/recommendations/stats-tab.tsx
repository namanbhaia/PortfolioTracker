import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, PieChart, Activity, AlertCircle, ShieldCheck, ShieldAlert } from "lucide-react";
import { getStatisticalSuggestions, ConcentrationAlert, VolatilityAlert, PledgedVolatilityAlert } from '@/lib/actions/suggestions/statistical_suggestions';

export default function StatsTab({ holdings, transactions, clients, pledges = [] }: { holdings: any[], transactions: any[], clients: any[], pledges?: any[] }) {
    const [concentration, setConcentration] = useState<ConcentrationAlert[]>([]);
    const [volatility, setVolatility] = useState<VolatilityAlert[]>([]);
    const [pledgedVolatility, setPledgedVolatility] = useState<PledgedVolatilityAlert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await getStatisticalSuggestions(holdings, pledges);
                setConcentration(res.concentration);
                setVolatility(res.volatility);
                setPledgedVolatility(res.pledgedVolatility);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [holdings, pledges]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl animate-pulse">
                    <CardHeader className="h-24 bg-slate-100 dark:bg-slate-800 rounded-t-xl" />
                    <CardContent className="h-64" />
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className={`grid grid-cols-1 ${pledges.length > 0 ? 'lg:grid-cols-3' : 'md:grid-cols-2'} gap-6`}>

                {/* Concentration Risk Card */}
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
                    <CardHeader>
                        <CardTitle className="text-xl text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                            <PieChart className="h-5 w-5 text-emerald-500" />
                            Asset Concentration Risk
                        </CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400 transition-colors">
                            Flags individual assets that make up more than 20% of your total portfolio value.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {concentration.length > 0 ? (
                            <div className="space-y-4">
                                {concentration.map((c, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/30 shadow-sm rounded-xl p-4 flex gap-4 transition-colors">
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full h-fit mt-1 transition-colors">
                                            <AlertCircle className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-lg transition-colors">{c.ticker} <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-2">{c.stock_name}</span></h4>
                                            <p className="text-emerald-600 dark:text-emerald-400 font-medium my-1 transition-colors">{c.percentage.toFixed(1)}% of Portfolio</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors">{c.warning}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed transition-colors">
                                <ShieldCheck className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-3" />
                                <h4 className="text-slate-900 dark:text-white font-medium transition-colors">Well Diversified</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px] mt-1 transition-colors">No single asset exceeds 20% of your portfolio value. Great job maintaining diversification!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Volatility & Beta Card */}
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
                    <CardHeader>
                        <CardTitle className="text-xl text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                            <Activity className="h-5 w-5 text-indigo-500" />
                            Volatility & Market Beta
                        </CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400 transition-colors">
                            Highlights extreme market sensitivity (Beta &gt; 1.5 or &lt; 0.5) among your top 10 holdings.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {volatility.length > 0 ? (
                            <div className="space-y-4">
                                {volatility.map((v, i) => {
                                    const isHigh = v.beta > 1.5;
                                    const colorClass = isHigh 
                                        ? 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-900/30 dark:text-rose-400' 
                                        : 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-900/30 dark:text-indigo-400';
                                    const iconColor = isHigh ? 'text-rose-500' : 'text-indigo-500';

                                    return (
                                        <div key={i} className={`bg-white dark:bg-slate-900 shadow-sm border rounded-xl p-4 flex gap-4 transition-all ${colorClass}`}>
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm h-fit mt-1 transition-colors">
                                                <Activity className={`w-5 h-5 ${iconColor}`} />
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-lg transition-colors">{v.ticker}</h4>
                                                    <div className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors">Beta: {v.beta.toFixed(2)}</div>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 transition-colors">{v.warning}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed transition-colors">
                                <LineChart className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-3" />
                                <h4 className="text-slate-900 dark:text-white font-medium transition-colors">Standard Volatility</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px] mt-1 transition-colors">Your top holdings have typical market sensitivity (Beta between 0.5 and 1.5).</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pledged Asset Risks Card */}
                {pledges.length > 0 && (
                    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
                        <CardHeader>
                            <CardTitle className="text-xl text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                                <ShieldAlert className="h-5 w-5 text-amber-500" />
                                Pledged Asset Risks
                            </CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400 transition-colors">
                                Tracks margin call and liquidation risks for your pledged holdings based on market volatility.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {pledgedVolatility.length > 0 ? (
                                <div className="space-y-4">
                                    {pledgedVolatility.map((pv, i) => (
                                        <div key={i} className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/30 shadow-sm rounded-xl p-4 flex gap-4 transition-colors">
                                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-full h-fit mt-1 transition-colors">
                                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-slate-900 dark:text-white text-lg transition-colors">{pv.ticker}</h4>
                                                    <div className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50/10 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 transition-colors">Beta: {pv.beta.toFixed(2)}</div>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 transition-colors">{pv.warning}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed transition-colors">
                                    <ShieldCheck className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-3" />
                                    <h4 className="text-slate-900 dark:text-white font-medium transition-colors">Pledges Secure</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px] mt-1 transition-colors">None of your pledged assets belong to highly volatile stock categories. Margin call risk is low.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

            </div>
        </div>
    );
}
