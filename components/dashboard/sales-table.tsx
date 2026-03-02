import { Info } from 'lucide-react';

import TrxIdCell from '@/components/ui/trx-id-cell';
import CommentCell from '@/components/ui/comment-cell';
import TickerCell from '@/components/ui/ticker-cell';
import SortArrow from '@/components/ui/sort-arrow';
import type { SortFieldSales } from '@/app/dashboard/sales/sales-client-wrapper';

interface SalesTableProps {
    sales: Record<string, any>[];
    sortConfig?: {
        key: string;
        direction: 'asc' | 'desc';
    };
    onSort?: (key: SortFieldSales) => void;
}

export default function SalesTable({ sales, sortConfig, onSort }: SalesTableProps) {
    const handleSort = (field: SortFieldSales) => {
        if (onSort) onSort(field);
    };

    return (
        <div className="border rounded-lg shadow-sm bg-white overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-gray-100 border-b uppercase text-gray-600 font-semibold">
                    <tr>
                        <th className="px-3 py-3 w-16">ID</th>
                        <th className="px-3 py-3">
                            <button onClick={() => handleSort('client_name')} className="hover:text-blue-600 flex items-center uppercase font-semibold">
                                Client Info<SortArrow field="client_name" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
                            </button>
                        </th>
                        <th className="px-3 py-3">
                            <button onClick={() => handleSort('ticker')} className="hover:text-blue-600 flex items-center uppercase font-semibold">
                                Ticker / ISIN <SortArrow field="ticker" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
                            </button>
                        </th>
                        <th className="px-3 py-3">
                            <button onClick={() => handleSort('stock_name')} className="hover:text-blue-600 flex items-center uppercase font-semibold">
                                Stock Name <SortArrow field="stock_name" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
                            </button>
                        </th>
                        <th className="px-3 py-3 text-right">Purchase Date</th>
                        <th className="px-3 py-3 text-right">Purchase Qty</th>
                        <th className="px-3 py-3 text-right">Purchase Rate</th>
                        <th className="px-3 py-3 text-right">Purchase Value</th>
                        <th className="px-3 py-3">
                            <button onClick={() => handleSort('sale_date')} className="hover:text-blue-600 flex items-center uppercase font-semibold">
                                Date <SortArrow field="sale_date" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
                            </button>
                        </th>
                        <th className="px-3 py-3 text-right">Sale Qty</th>
                        <th className="px-3 py-3 text-right">Sale Rate</th>
                        <th className="px-3 py-3 text-right">Sale Value</th>
                        <th className="px-3 py-3 text-right">
                            <button onClick={() => handleSort('pl_percentage')} className="hover:text-blue-600 flex items-center justify-end w-full uppercase font-semibold">
                                P/L % <SortArrow field="pl_percentage" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
                            </button>
                        </th>
                        <th className="px-3 py-3 text-right">
                            <button onClick={() => handleSort('pl')} className="hover:text-blue-600 flex items-center justify-end w-full uppercase font-semibold">
                                Total P/L <SortArrow field="pl" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
                            </button>
                        </th>
                        <th className="px-3 py-3 text-right">Grandfathered P/L</th>
                        <th className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <button onClick={() => handleSort('long_term')} className="hover:text-blue-600 flex items-center uppercase font-semibold">
                                    Term <SortArrow field="long_term" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
                                </button>
                                <div className="group relative">
                                    <Info size={14} className="text-slate-400 cursor-help" />
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg z-50 pointer-events-none normal-case tracking-normal font-normal">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 font-normal"><span className="text-green-400">✓</span> Long Term (&gt;365 days)</div>
                                            <div className="flex items-center gap-2 font-normal"><span className="text-red-400">✕</span> Short Term (&lt;365 days)</div>
                                            <div className="flex items-center gap-2 font-normal"><span className="text-amber-400">⚡</span> Square Off (Same Day)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </th>
                        <th className="px-3 py-3">Comments</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {sales?.map((row) => (
                        <tr key={row.trx_id} className={`hover:bg-gray-50`}>
                            <td className="px-3 py-3">
                                <TrxIdCell id={row.trx_id} />
                            </td>
                            <td className="p-3">
                                <div className="font-semibold text-gray-900">{row.client_name}</div>
                                <div className="text-[10px] opacity-70">DP: {row.dp_id} | Trade: {row.trading_id}</div>
                            </td>
                            <TickerCell ticker={row.ticker} isin={row.isin} />
                            <td className="px-3 py-3 max-w-[120px] truncate">{row.stock_name}</td>
                            <td className="px-3 py-3 whitespace-nowrap">
                                {new Date(row.purchase_date).toLocaleDateString('en-IN', { timeZone: 'UTC' })}
                            </td>
                            <td className="px-3 py-3 text-right">
                                {(Number(row.purchase_qty) || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-3 py-3 text-right">₹{Number(row.purchase_rate).toFixed(2)}</td>
                            <td className="px-3 py-3 text-right">₹{Number(row.purchase_value).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-3 whitespace-nowrap">
                                {new Date(row.sale_date).toLocaleDateString('en-IN', { timeZone: 'UTC' })}
                            </td>
                            <td className="px-3 py-3 text-right">{Number(row.sale_qty)}</td>
                            <td className="px-3 py-3 text-right">₹{Number(row.sale_rate).toFixed(2)}</td>
                            <td className="px-3 py-3 text-right">₹{Number(row.sale_value).toLocaleString('en-IN')}</td>
                            <td className={`px-3 py-3 text-right font-semibold ${row.pl_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {Number(row.pl_percentage).toFixed(2)}%
                            </td>
                            <td className={`px-3 py-3 text-right font-bold ${row.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{Number(row.pl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className={`px-3 py-3 text-right font-bold ${row.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{Number(row.adjusted_pl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-3 text-center">
                                <div className="flex justify-center items-center">
                                    {row.long_term ? (
                                        <span className="text-green-600 font-bold" title="Long Term">✓</span>
                                    ) : row.is_square_off ? (
                                        <span className="text-amber-500 font-bold" title="Square Off">⚡</span>
                                    ) : (
                                        <span className="text-red-500 font-bold" title="Short Term">✕</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-3 py-3">
                                <CommentCell comment={row.comments} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}