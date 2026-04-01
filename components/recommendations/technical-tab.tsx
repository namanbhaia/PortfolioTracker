"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    Activity,
    Scale,
    ChevronUp,
    ChevronDown,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import { getTechnicalSuggestions, TechnicalSuggestion } from '@/lib/actions/suggestions/technical_suggestions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TechnicalTab({ holdings }: { holdings: any[] }) {
    const [suggestions, setSuggestions] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTechnical = async () => {
            setLoading(true);
            try {
                const res = await getTechnicalSuggestions(holdings);
                setSuggestions(res);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchTechnical();
    }, [holdings]);

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

    if (!suggestions) return null;

    const sections = [
        { id: 'yearly', title: '52-Week Range', icon: TrendingUp, data: [...suggestions.aboveHigh, ...suggestions.belowLow] },
        { id: 'volume', title: 'Volume Insights', icon: BarChart3, data: [...suggestions.highVolume, ...suggestions.lowVolume] },
        { id: 'pe', title: 'Valuation (P/E)', icon: Scale, data: [...suggestions.highPE, ...suggestions.lowPE] },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sections.map((section) => (
                    <Card key={section.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
                        <CardHeader>
                            <CardTitle className="text-xl text-slate-900 dark:text-white flex items-center gap-2 transition-colors">
                                <section.icon className="h-5 w-5 text-indigo-500" />
                                {section.title}
                            </CardTitle>
                            <CardDescription className="text-slate-500 dark:text-slate-400">
                                Technical and fundamental signals for your holdings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {section.data.length > 0 ? (
                                <div className="space-y-4">
                                    {section.data.map((item: TechnicalSuggestion, i: number) => {
                                        const isBullish = item.type.includes('Above') || item.type.includes('High Relative Volume') || item.type.includes('Low P/E');
                                        const colorClass = isBullish 
                                            ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-900/10' 
                                            : 'border-rose-200 bg-rose-50/30 dark:border-rose-900/30 dark:bg-rose-900/10';
                                        const Icon = isBullish ? ChevronUp : ChevronDown;
                                        const iconColor = isBullish ? 'text-emerald-500' : 'text-rose-500';

                                        return (
                                            <div key={i} className={`border rounded-xl p-4 flex gap-4 transition-all hover:shadow-md ${colorClass}`}>
                                                <div className={`p-2 rounded-full h-fit mt-1 bg-white dark:bg-slate-800 shadow-sm transition-colors`}>
                                                    <Icon className={`w-5 h-5 ${iconColor}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-slate-900 dark:text-white transition-colors">{item.ticker}</h4>
                                                        <span className="text-xs font-bold px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors">
                                                            {item.value}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 transition-colors">{item.stock_name}</p>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">{item.type}</p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed transition-colors">{item.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed transition-colors">
                                    <CheckCircle2 className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-3" />
                                    <h4 className="text-slate-900 dark:text-white font-medium transition-colors">No Major Signals</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px] mt-1 transition-colors">None of your current holdings show significant {section.title.toLowerCase()} signals.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
