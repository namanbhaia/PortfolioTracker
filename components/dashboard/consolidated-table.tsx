export function ConsolidatedTable({ data, grandTotal }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                    <tr>
                        <th className="px-6 py-4">Stock Name / Ticker</th>
                        <th className="px-6 py-4 text-right">Family Qty</th>
                        <th className="px-6 py-4 text-right">Avg Rate</th>
                        <th className="px-6 py-4 text-right">Market Value</th>
                        <th className="px-6 py-4 text-right">% Allocation</th>
                        <th className="px-6 py-4">Held In</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((row) => (
                        <tr key={row.ticker} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{row.ticker}</div>
                                <div className="text-[11px] text-slate-400">{row.stock_name}</div>
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-medium">{row.total_qty}</td>
                            <td className="px-6 py-4 text-right font-mono text-slate-500">₹{row.avg_purchase_price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">₹{row.total_market_value.toLocaleString('en-IN')}</td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-3">
                                    <span className="text-[11px] font-bold text-slate-400">{((row.total_market_value / grandTotal) * 100).toFixed(1)}%</span>
                                    <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500" style={{ width: `${(row.total_market_value / grandTotal) * 100}%` }} />
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                    {row.accounts.map(acc => (
                                        <span key={acc} className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter bg-slate-100 text-slate-500 border border-slate-200">
                                            {acc}
                                        </span>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {data.length === 0 && (
                <div className="p-12 text-center text-slate-400 italic">
                    No holdings found for the selected clients.
                </div>
            )}
        </div>
    );
}