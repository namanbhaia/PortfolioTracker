import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
    Users,
    TrendingUp,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    PieChart,
    Info
} from 'lucide-react';
import { ClientFilter } from '@/components/ClientFilter';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import ConsolidatedHoldingsTable from '@/components/dashboard/consolidated-holdings-table';

interface DashboardProps {
    searchParams: Promise<{ clients?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
    const supabase = await createClient();
    const params = await searchParams;

    // 1. Authenticate User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // 2. Fetch User Profile (to get authorized client_ids)
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, client_ids')
        .eq('id', user.id)
        .single();

    if (!profile || !profile.client_ids || profile.client_ids.length === 0) {
        return (
            <div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <Users className="mx-auto text-slate-300 mb-4" size={48} />
                <h2 className="text-xl font-bold text-slate-700">No Linked Accounts</h2>
                <p className="text-slate-500 text-sm">Please link family clients to your profile to view data.</p>
            </div>
        );
    }

    // 3. Fetch Metadata for Filter Dropdown
    const { data: clientMetadata } = await supabase
        .from('clients')
        .select('client_id, client_name')
        .in('client_id', profile.client_ids);

    // 4. Fetch Holdings Data
    let query = supabase
        .from('client_holdings') // Using the user-specified view name
        .select('*')
        .in('client_id', profile.client_ids)
        .gt('balance_qty', 0);

    const selectedNames = params.clients ? params.clients.split(',').filter(Boolean) : [];
    if (selectedNames.length > 0) {
        query = query.in('client_name', selectedNames);
    }

    const { data: rawHoldings, error } = await query;

    if (error) {
        console.error("Dashboard Fetch Error:", error.message);
    }

    // 5. Aggregate Data by Ticker
    const aggregatedMap = (rawHoldings || []).reduce((acc: any, curr) => {
        const key = curr.ticker;
        if (!acc[key]) {
            acc[key] = {
                ticker: curr.ticker,
                isin: curr.isin,
                stock_name: curr.stock_name,
                total_qty: 0,
                total_purchase_value: 0,
                market_rate: Number(curr.market_rate),
                total_market_value: 0,
            };
        }

        const qty = Number(curr.balance_qty);
        const purchaseRate = Number(curr.rate || curr.purchase_rate); // Fallback depending on view column name

        acc[key].total_qty += qty;
        acc[key].total_purchase_value += qty * purchaseRate;
        acc[key].total_market_value += qty * Number(curr.market_rate);

        return acc;
    }, {});

    const consolidatedRows = Object.values(aggregatedMap).map((item: any) => {
        const avg_purchase_price = item.total_purchase_value / item.total_qty;
        const pl = item.total_market_value - item.total_purchase_value;
        const pl_percent = item.total_purchase_value > 0 ? (pl / item.total_purchase_value) * 100 : 0;
        return {
            ...item,
            avg_purchase_price,
            pl,
            pl_percent
        };
    }).sort((a, b) => a.ticker.localeCompare(b.ticker));

    // 6. Global Portfolio Metrics
    const totalInvested = consolidatedRows.reduce((acc, row) => acc + row.total_purchase_value, 0);
    const currentTotalValue = consolidatedRows.reduce((acc, row) => acc + row.total_market_value, 0);
    const totalPL = currentTotalValue - totalInvested;
    const plPercentage = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Executive Summary</h1>
                    <p className="text-sm text-slate-500">
                        Consolidated overview for <span className="font-semibold text-indigo-600">{profile.full_name}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <ClientFilter
                        availableClients={clientMetadata || []}
                        currentSelection={selectedNames}
                    />
                </div>
            </header>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Invested</CardTitle>
                        <Wallet className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Current Value</CardTitle>
                        <PieChart className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-600">₹{currentTotalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Possible P/L</CardTitle>
                        <TrendingUp className={`h-4 w-4 ${totalPL >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{totalPL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                        <p className={`text-xs font-bold flex items-center mt-1 ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalPL >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {plPercentage.toFixed(2)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* CONSOLIDATED HOLDINGS TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Union of Family Holdings</h3>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-md">
                        {consolidatedRows.length} TICKERS
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <ConsolidatedHoldingsTable consolidatedRows={consolidatedRows || []} />

                    {consolidatedRows.length === 0 && (
                        <tr>
                            <td colSpan={9} className="py-20 text-center text-slate-400 italic">
                                No holdings found for the selected accounts.
                            </td>
                        </tr>
                    )}
                </div>
            </div>
        </div>
    );
}