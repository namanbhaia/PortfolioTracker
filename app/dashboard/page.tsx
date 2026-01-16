import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
    Users,
    TrendingUp,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    PieChart
} from 'lucide-react';
import { ClientFilter } from '@/components/ClientFilter';

interface DashboardProps {
    searchParams: Promise<{ clients?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
    const supabase = await createClient();
    const params = await searchParams;

    // 1. Authenticate User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // 2. Fetch User Profile (to get authorized client_ids and full name)
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
                <p className="text-slate-500 text-sm">Please link family clients to your profile to view dashboard data.</p>
            </div>
        );
    }

    // 3. Fetch Metadata for Filter Dropdown
    const { data: clientMetadata } = await supabase
        .from('clients')
        .select('client_id, client_name')
        .in('client_id', profile.client_ids);

    // 4. Build Consolidated Holdings Query
    let query = supabase
        .from('client_holdings')
        .select('*')
        .in('client_id', profile.client_ids)
        .gt('balance_qty', 0); // Only show active holdings on main dashboard

    // Apply Multi-select filter from URL
    if (params.clients) {
        const selectedNames = params.clients.split(',').filter(Boolean);
        if (selectedNames.length > 0) {
            query = query.in('client_name', selectedNames);
        }
    }

    const { data: holdings, error } = await query.order('market_value', { ascending: false });

    if (error) {
        console.error("Dashboard Fetch Error:", error.message);
    }

    // 5. Calculate Global Portfolio Metrics
    const activeData = holdings || [];
    const totalInvestment = activeData.reduce((acc, h) => acc + (Number(h.rate) * Number(h.balance_qty)), 0);
    const currentTotalValue = activeData.reduce((acc, h) => acc + Number(h.market_value), 0);
    const totalPL = currentTotalValue - totalInvestment;
    const plPercentage = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0;

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            {/* HEADER SECTION */}
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
                        currentSelection={params.clients ? params.clients.split(',') : []}
                    />
                </div>
            </header>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card: Total Invested */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-hover hover:shadow-md">
                    <div className="flex items-center gap-3 mb-4 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-600"><Wallet size={16} /></div>
                        Total Invested
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                        ₹{totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                </div>

                {/* Card: Current Value */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-hover hover:shadow-md">
                    <div className="flex items-center gap-3 mb-4 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><PieChart size={16} /></div>
                        Current Value
                    </div>
                    <div className="text-3xl font-bold text-indigo-600">
                        ₹{currentTotalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                </div>

                {/* Card: Profit/Loss */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-hover hover:shadow-md">
                    <div className="flex items-center gap-3 mb-4 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-600"><TrendingUp size={16} /></div>
                        Unrealized P/L
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-3xl font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{totalPL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        <span className={`text-sm font-bold flex items-center ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalPL >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {plPercentage.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* HOLDINGS TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Top Family Holdings</h3>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-md">
                        {activeData.length} POSITIONS
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase">
                            <tr>
                                <th className="px-6 py-4">Client</th>
                                <th className="px-6 py-4">Security</th>
                                <th className="px-6 py-4 text-right">Avg. Rate</th>
                                <th className="px-6 py-4 text-right">Current Value</th>
                                <th className="px-6 py-4 text-right">P/L %</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activeData.map((row: any) => (
                                <tr key={row.trx_id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 font-semibold text-slate-700">{row.client_name}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-indigo-600 text-sm">{row.ticker}</span>
                                            <span className="text-[10px] text-slate-400 truncate max-w-[150px]">{row.stock_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500 font-mono">₹{Number(row.rate).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                                        ₹{Number(row.market_value).toLocaleString('en-IN')}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-bold ${row.pl_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {row.pl_percent > 0 ? '+' : ''}{Number(row.pl_percent).toFixed(2)}%
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${row.is_long_term ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {row.is_long_term ? 'LTCG' : 'STCG'}
                                        </span>
                                    </td>
                                </tr>
                            ))}

                            {activeData.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-slate-400 italic">
                                        No active holdings found for the selected accounts.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}