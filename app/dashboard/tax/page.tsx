import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, LayoutList } from 'lucide-react';
import { DateRangeFilter } from './date-range-filter';
import Link from 'next/link';
import { getTodayDate } from '@/components/helper/utility';

export default async function TaxReportOverviewPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const startDate = resolvedParams.start_date as string;
    const endDate = resolvedParams.end_date as string || getTodayDate();

    // Check if report has been triggered
    const hasDates = !!(startDate && endDate);

    // Fetch clients (we need these for the list regardless, or you can move this inside the check)
    const { data: clients } = await supabase.from('clients').select('client_id, client_name').order('client_name');

    let salesByClient: Record<string, any> = {};

    if (hasDates) {
        const { data: sales } = await supabase
            .from('sales')
            .select('client_id, profit_stored, long_term, adjusted_profit_stored')
            .gte('date', startDate)
            .lte('date', endDate);

        sales?.forEach(sale => {
            if (!salesByClient[sale.client_id]) {
                salesByClient[sale.client_id] = { stcg: 0, ltcg: 0, atlcg: 0, count: 0 };
            }
            if (sale.long_term) {
                salesByClient[sale.client_id].ltcg += Number(sale.profit_stored);
                salesByClient[sale.client_id].altcg += Number(sale.adjusted_profit_stored);
            }
            else salesByClient[sale.client_id].stcg += Number(sale.profit_stored);
            salesByClient[sale.client_id].count++;
        });
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tax Overview</h1>
                <p className="text-slate-500 mt-1">Select a period to aggregate capital gains across all clients.</p>
            </header>


            <DateRangeFilter initialDates={{ startDate, endDate }} />
    
            {hasDates ? (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {clients?.map((client) => {
                        const stats = salesByClient[client.client_id] || { stcg: 0, ltcg: 0, altcg: 0, count: 0 };
                        const params = new URLSearchParams({
                            client_ids: client.client_id,
                            start_date: startDate,
                            end_date: endDate
                        });
                        return (
                            <Card key={client.client_id} className="border-slate-200 hover:shadow-md transition-all">
                                <CardContent className="p-5 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <h3 className="font-bold text-slate-900">{client.client_name}</h3>
                                            <p className="text-[11px] text-slate-500 uppercase font-medium tracking-wide">
                                                {stats.count} Sales Found
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-10">
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Short Term Profit</p>
                                            <p className={`text-sm font-mono font-bold ${stats.stcg >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                ₹{stats.stcg.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Long Term Profit</p>
                                            <p className={`text-sm font-mono font-bold ${stats.ltcg >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                ₹{stats.ltcg.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Adjusted Long Term Profit</p>
                                            <p className={`text-sm font-mono font-bold ${stats.altcg >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                ₹{stats.ltcg.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <Link href={`/dashboard/sales?${params.toString()}`}>
                                            <Button variant="ghost" className="text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 font-bold gap-2">
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
                /* EMPTY STATE - Default View */
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4">
                        <LayoutList className="text-slate-300" size={40} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No Report Generated</h3>
                    <p className="text-slate-500 text-sm max-w-xs text-center mt-2">
                        Set a date range above and click <span className="font-bold text-indigo-600">Run Report</span> to view capital gains.
                    </p>
                </div>
            )}
        </div>
    );
}