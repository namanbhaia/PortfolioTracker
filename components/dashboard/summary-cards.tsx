import { IndianRupee, TrendingUp, Landmark, ShieldAlert } from 'lucide-react';

export default function SummaryCards({ metrics }: { metrics: any }) {
  const stats = [
    {
      label: 'Total AUM',
      value: `₹${metrics?.total_market_value.toLocaleString('en-IN')}`,
      icon: Landmark,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      label: 'Realized Profit (FY)',
      value: `₹${metrics?.total_realized_profit.toLocaleString('en-IN')}`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      label: 'Est. Tax Liability',
      value: `₹${metrics?.total_tax_due.toLocaleString('en-IN')}`,
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