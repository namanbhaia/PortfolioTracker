import Link from 'next/link';

// Define the valid sortable columns for internal component use
type SortField = 'ticker' | 'stock_name' | 'pl_percent' | 'pl';

interface ConsolidatedHoldingsTableProps {
    consolidatedRows: any[];
}

export default function ConsolidatedHoldingsTable({ consolidatedRows}: ConsolidatedHoldingsTableProps) {
    // Helper function to create sort URLs
    return (
        <div className="border rounded-lg shadow-sm bg-white overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-gray-100 border-b uppercase text-gray-600 font-semibold">
                    <tr>
                        <th className="px-3 py-3 text-right">Ticker / ISIN</th>
                        <th className="px-3 py-3 text-right">Stock Name</th>
                        <th className="px-3 py-3 text-right">Bal Qty</th>
                        <th className="px-3 py-3 text-right">Avg Rate</th>
                        <th className="px-3 py-3 text-right">Purchase Value</th>
                        <th className="px-3 py-3 text-right">Market Rate</th>
                        <th className="px-3 py-3 text-right">Market Value</th>
                        <th className="px-3 py-3 text-right">P/L %</th>
                        <th className="px-3 py-3 text-right">P/L</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {consolidatedRows?.map((row) => (
                        <tr key={row.ticker} className={`hover:bg-slate-50/80 transition-colors group`}>
                            <td className="px-3 py-3">
                                <div className="font-bold text-blue-700">{row.ticker}</div>
                                <div className="text-[10px] text-gray-400">{row.isin}</div>
                            </td>
                            <td className="px-3 py-3 max-w-[120px] truncate">{row.stock_name}</td>
                            <td className="px-3 py-3 text-right">{Number(row.total_qty)}</td>
                            <td className="px-3 py-3 text-right">₹{Number(row.avg_purchase_price.toFixed(2))}</td>
                            <td className="px-3 py-3 text-right">₹{Number(row.total_purchase_value).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3 text-right">₹{row.market_rate.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3 text-right text-indigo-600">₹{row.total_market_value.toLocaleString('en-IN')}</td>
                            <td className={`px-3 py-3 text-right font-semibold ${row.pl_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Number(row.pl_percent).toFixed(2)}%
                            </td>
                            <td className={`px-3 py-3 text-right font-bold ${row.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{Number(row.pl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}