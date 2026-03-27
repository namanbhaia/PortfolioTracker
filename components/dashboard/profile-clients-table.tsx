"use client"

/**
 * @file profile-clients-table.tsx
 * @description Renders a summary table of all client portfolios linked to the current user's profile.
 */

import { Check, Users } from 'lucide-react';

/**
 * Component for displaying linked client portfolios in the user profile.
 * @param {Object} props - Component props.
 * @param {any[]} props.clients - List of client metadata objects.
 */
export default function ProfileClientsTable({ clients }: { clients: any[] }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                    <Users size={18} /> Linked Portfolios
                </div>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase transition-colors">
                    {clients.length} Accounts
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-3">Client Name</th>
                            <th className="px-6 py-3">Trading ID</th>
                            <th className="px-6 py-3">DP ID</th>
                            <th className="px-6 py-3">Last Verified</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {clients.map((client, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{client.client_name}</td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{client.trading_id || '—'}</td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">{client.dp_id || '—'}</td>
                                <td className="px-6 py-4">
                                    {client.last_verified ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 transition-colors">
                                            <Check size={12} />
                                            {new Date(client.last_verified).toLocaleDateString('en-IN', { timeZone: 'UTC' })}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400 dark:text-slate-600 italic transition-colors">Never</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {clients.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-slate-400 dark:text-slate-600 italic transition-colors">
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