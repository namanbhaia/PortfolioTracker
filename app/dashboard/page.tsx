import { createClient } from '@/lib/supabase/server';
import SummaryCards from '@/components/dashboard/summary-cards';
import { Users, UserCircle } from 'lucide-react';

export default async function DashboardHome() {
    const supabase = await createClient();

    // 1. Get Logged In User ID
    const { data: { user } } = await supabase.auth.getUser();

    // 2. Parallel Fetch: Profile, Clients, and Metrics
    const [profileResponse, clientsResponse, metricsResponse] = await Promise.all([
        // A. Fetch Manager Profile (for Name)
        supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', user?.id)
            .single(),

        // B. Fetch Managed Clients
        supabase
            .from('clients')
            .select('client_name')
            .eq('user_id', user?.id),

        // C. Fetch Portfolio Metrics
        supabase.rpc('get_portfolio_summary', { manager_uuid: user?.id })
    ]);

    const profile = profileResponse.data;
    const clients = clientsResponse.data || [];
    const metrics = metricsResponse.data;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
                    <p className="text-slate-500 mt-2 flex items-center gap-2">
                        <UserCircle size={16} className="text-indigo-600" />
                        Active Manager:
                        <span className="font-semibold text-slate-700">
                            {profile?.full_name || profile?.username || user?.email}
                        </span>
                    </p>
                </div>

                {/* Client List Badge */}
                <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 min-w-[200px]">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        <Users size={14} />
                        Managed Accounts ({clients.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {clients.length > 0 ? (
                            clients.map((c: any) => (
                                <span key={c.client_name} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 shadow-sm">
                                    {c.client_name}
                                </span>
                            ))
                        ) : (
                            <span className="text-sm text-slate-400 italic">No clients linked.</span>
                        )}
                    </div>
                </div>
            </header>

            {/* Metrics Cards */}
            <SummaryCards metrics={metrics || {}} />
        </div>
    );
}