"use client"

import { Check, Users } from 'lucide-react';

export default function ProfileClientsTable({ clients }: { clients: any[] }) {
    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <Users size={18} /> Linked Portfolios
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase">
                    {clients.length} Accounts
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b">
                        <tr>
                            <th className="px-6 py-3">Client Name</th>
                            <th className="px-6 py-3">Trading ID</th>
                            <th className="px-6 py-3">DP ID</th>
                            <th className="px-6 py-3">Last Verified</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {clients.map((client, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-semibold text-slate-900">{client.client_name}</td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{client.trading_id || '—'}</td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-500">{client.dp_id || '—'}</td>
                                <td className="px-6 py-4">
                                    {client.last_verified ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                            <Check size={12} />
                                            {new Date(client.last_verified).toLocaleDateString()}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">Never</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {clients.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">
                                    No family clients linked to this profile.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}