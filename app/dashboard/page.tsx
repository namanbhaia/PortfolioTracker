import { createClient } from '@/lib/supabase/server';
import SummaryCards from '@/components/dashboard/summary-cards';
import AllocationChart from '@/components/dashboard/allocation-chart';
import RecentActivity from '@/components/dashboard/recent-activity';

export default async function DashboardHome() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch Aggregated Metrics from a custom RPC or View
    // We want: Total Market Value, Total Realized Profit (FY), Total Tax Due
    const { data: metrics } = await supabase.rpc('get_portfolio_summary', { manager_uuid: user?.id });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Summary</h1>
                <p className="text-slate-500">Global view across all managed family entities.</p>
            </header>

            {/* High-Level Stats */}
            <SummaryCards metrics={metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Decision Support: Asset Allocation */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Asset Concentration</h3>
                    <AllocationChart userId={user?.id} />
                </div>

                {/* Actionable Feed: Recent Trades */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Recent Activity</h3>
                    <RecentActivity userId={user?.id} />
                </div>
            </div>
        </div>
    );
}