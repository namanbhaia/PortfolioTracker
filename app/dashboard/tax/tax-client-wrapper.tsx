"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, LayoutList } from 'lucide-react';
import { DateRangeFilter } from './date-range-filter';
import { useUser } from '@/components/helper/user-context';
import Link from 'next/link';

export default function TaxClientWrapper({
    initialSales,
    initialDates
}: {
    initialSales: any[],
    initialDates: { startDate: string, endDate: string }
}) {
    const { clients } = useUser();
    const [startDate, setStartDate] = useState(initialDates.startDate || "");
    const [endDate, setEndDate] = useState(initialDates.endDate || "");

    // Check if report should be shown
    const hasDates = !!(startDate && endDate);

    // Dynamic aggregation based on local date state
    const salesByClient = useMemo(() => {
        const result: Record<string, any> = {};
        if (!hasDates) return result;

        const filtered = initialSales.filter(sale =>
            sale.sale_date >= startDate && sale.sale_date <= endDate
        );

        filtered.forEach(sale => {
            const cid = sale.client_id;
            if (!result[cid]) {
                result[cid] = { stcg: 0, ltcg: 0, altcg: 0, sqoff: 0, count: 0 };
            }
            if (sale.long_term) {
                result[cid].ltcg += Number(sale.pl || 0);
                result[cid].altcg += Number(sale.adjusted_pl || 0);
            }
            else if (sale.is_square_off) {
                result[cid].sqoff += Number(sale.pl || 0);
            }
            else {
                result[cid].stcg += Number(sale.pl || 0);
            }
            result[cid].count++;
        });

        return result;
    }, [initialSales, startDate, endDate, hasDates]);

    return (
        <div className="space-y-8">
            <DateRangeFilter
                initialDates={{ startDate, endDate }}
                onFilter={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                }}
            />

            {hasDates ? (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {clients?.map((client) => {
                        const stats = salesByClient[client.client_id] || { stcg: 0, ltcg: 0, altcg: 0, sqoff: 0, count: 0 };
                        const params = new URLSearchParams({
                            client_ids: client.client_id,
                            start_date: startDate,
                            end_date: endDate
                        });
                        return (
                            <Card key={client.client_id} className="border-slate-200 dark:border-slate-800 hover:shadow-md dark:hover:shadow-indigo-500/10 transition-all">
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">{client.client_name}</h3>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-medium tracking-wide">
                                                {stats.count} Sales Found
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-10">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Square-Off Profit</p>
                                            <p className={`text-sm font-mono font-bold ${stats.sqoff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                ₹{stats.sqoff.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Short Term Profit</p>
                                            <p className={`text-sm font-mono font-bold ${stats.stcg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                ₹{stats.stcg.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Long Term Profit</p>
                                            <p className={`text-sm font-mono font-bold ${stats.ltcg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                ₹{stats.ltcg.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Adjusted Long Term Profit</p>
                                            <p className={`text-sm font-mono font-bold ${stats.altcg >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                ₹{stats.altcg.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <Link href={`/dashboard/sales?${params.toString()}`}>
                                            <Button variant="ghost" className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold gap-2">
                                                Inspect <ChevronRight size={16} />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-4">
                        <LayoutList className="text-slate-300" size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Report Generated</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs text-center mt-2">
                        Set a date range above and click <span className="font-bold text-indigo-600 dark:text-indigo-400">Run Report</span> to view capital gains.
                    </p>
                </div>
            )}
        </div>
    );
}
