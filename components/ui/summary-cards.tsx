import { TrendingUp, Landmark, ShieldAlert } from 'lucide-react';

export default function SummaryCards({ metrics }: { metrics: any }) {
    // Helper to safely format numbers, defaulting to 0 if null/undefined
    const formatCurrency = (val: any) =>
        (val || 0).toLocaleString('en-IN');

    const stats = [
        {
            label: 'Total Invested',
            value: `₹${formatCurrency(metrics?.total_invested)}`,
            icon: Landmark,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        },
        {
            label: 'Current Value',
            value: `₹${formatCurrency(metrics?.current_value)}`,
            icon: TrendingUp,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            label: 'Total P&L',
            value: `₹${formatCurrency(metrics?.total_pl)}`,
            icon: ShieldAlert,
            color: 'text-amber-600',
            bg: 'bg-amber-50'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat) => (
                <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
                    <div className={`${stat.bg} ${stat.color} p-4 rounded-xl`}>
                        <stat.icon size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                        <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}