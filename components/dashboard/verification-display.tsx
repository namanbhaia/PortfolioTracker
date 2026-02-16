import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { VerificationResult } from '@/components/helper/verification-utils';

interface VerificationDisplayProps {
    selectedResult: VerificationResult;
}

export function VerificationDisplay({ selectedResult }: VerificationDisplayProps) {
    if (selectedResult.status === 'MATCH') {
        return (
            <div className="p-12 flex flex-col items-center text-center gap-4 text-emerald-600">
                <CheckCircle size={64} />
                <h2 className="text-2xl font-bold text-slate-900">All Clear!</h2>
                <p className="text-slate-600 max-w-md">
                    Holdings match perfectly between Website and DP Manager.
                    <br />
                    Timestamp updated successfully.
                </p>
            </div>
        );
    }

    if (selectedResult.status === 'MISMATCH') {
        return (
            <div>
                <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center gap-3 text-rose-700">
                    <AlertTriangle size={20} />
                    <span className="font-bold">Discrepancies Found</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider">
                            <tr>
                                <th className="px-6 py-3">Client / DP ID</th>
                                <th className="px-6 py-3">Asset</th>
                                <th className="px-6 py-3 text-right">DP Balance</th>
                                <th className="px-6 py-3 text-right">Web Balance</th>
                                <th className="px-6 py-3 text-right">Diff</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {selectedResult.discrepancies.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-6 py-3">
                                        <div className="font-bold text-slate-900">{row.client_name}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{row.dp_id}</div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="font-bold">{row.ticker}</div>
                                        <div className="text-[10px] text-slate-400">{row.isin}</div>
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-slate-600">
                                        {row.dp_balance}
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-slate-600">
                                        {row.web_balance}
                                    </td>
                                    <td className="px-6 py-3 text-right font-bold text-rose-600">
                                        {row.difference > 0 ? "+" : ""}{row.difference}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return null;
}
