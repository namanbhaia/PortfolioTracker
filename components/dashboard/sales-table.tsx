/**
 * @file sales-table.tsx
 * @description Renders a detailed table of sale transactions with profit/loss metrics and sorting.
 */

import { useRef, useEffect, useMemo } from 'react';
import { Info } from 'lucide-react';

import TrxIdCell from '@/components/tables/trx-id-cell';
import CommentCell from '@/components/tables/comment-cell';
import TickerCell from '@/components/tables/ticker-cell';
import SortArrow from '@/components/tables/sort-arrow';
import type { SortFieldSales } from '@/app/dashboard/sales/sales-client-wrapper';

const columnsConfig = [
    { id: 'id', width: '60px' },
    { id: 'client_info', width: '180px' },
    { id: 'ticker', width: '130px' },
    { id: 'stock_name', width: '180px' },
    { id: 'purchase_date', width: '110px' },
    { id: 'purchase_qty', width: '100px' },
    { id: 'purchase_rate', width: '110px' },
    { id: 'purchase_value', width: '120px' },
    { id: 'sale_date', width: '110px' },
    { id: 'sale_qty', width: '100px' },
    { id: 'sale_rate', width: '110px' },
    { id: 'sale_value', width: '120px' },
    { id: 'pl_percentage', width: '90px' },
    { id: 'pl', width: '130px' },
    { id: 'grandfathered_pl', width: '140px' },
    { id: 'term', width: '90px' },
    { id: 'comments', width: '160px' },
];

interface SalesTableProps {
    sales: Record<string, any>[];
    sortConfig?: {
        key: string;
        direction: 'asc' | 'desc';
    };
    onSort?: (key: SortFieldSales) => void;
}

export const sales_columns = [
    { id: 'id', label: 'ID' },
    { id: 'client_info', label: 'Client Info' },
    { id: 'ticker', label: 'Ticker / ISIN' },
    { id: 'stock_name', label: 'Stock Name' },
    { id: 'purchase_date', label: 'Purchase Date' },
    { id: 'purchase_qty', label: 'Purchase Qty' },
    { id: 'purchase_rate', label: 'Purchase Rate' },
    { id: 'purchase_value', label: 'Purchase Value' },
    { id: 'sale_date', label: 'Sale Date' },
    { id: 'sale_qty', label: 'Sale Qty' },
    { id: 'sale_rate', label: 'Sale Rate' },
    { id: 'sale_value', label: 'Sale Value' },
    { id: 'pl_percentage', label: 'P/L %' },
    { id: 'pl', label: 'Total P/L' },
    { id: 'grandfathered_pl', label: 'Section 112A Baseline FMV Grandfathered P/L' },
    { id: 'term', label: 'Term' },
    { id: 'comments', label: 'Comments' },
];

/**
 * Component for displaying the detailed sales table.
 * @param {SalesTableProps} props - Component props.
 */
export default function SalesTable({ sales, sortConfig, onSort, isVisible }: SalesTableProps & { isVisible: (id: string) => boolean }) {
    const handleSort = (field: SortFieldSales) => {
        if (onSort) onSort(field);
    };

    const bodyContainerRef = useRef<HTMLDivElement>(null);
    const footerContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const body = bodyContainerRef.current;
        const footer = footerContainerRef.current;
        if (!body || !footer) return;

        const handleScroll = () => {
            footer.scrollLeft = body.scrollLeft;
        };

        body.addEventListener('scroll', handleScroll);
        return () => {
            body.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Calculate column sums in a single pass; memoised so it only recomputes when `sales` changes.
    const { totalPurchaseQty, totalPurchaseValue, totalSaleQty, totalSaleValue, totalPL, totalGrandfatheredPL } =
        useMemo(() => {
            const acc = { totalPurchaseQty: 0, totalPurchaseValue: 0, totalSaleQty: 0, totalSaleValue: 0, totalPL: 0, totalGrandfatheredPL: 0 };
            if (!sales) return acc;
            for (const row of sales) {
                acc.totalPurchaseQty   += Number(row.purchase_qty)   || 0;
                acc.totalPurchaseValue += Number(row.purchase_value) || 0;
                acc.totalSaleQty       += Number(row.sale_qty)       || 0;
                acc.totalSaleValue     += Number(row.sale_value)     || 0;
                acc.totalPL            += Number(row.pl)             || 0;
                acc.totalGrandfatheredPL += Number(row.adjusted_pl)  || 0;
            }
            return acc;
        }, [sales]);

    const nonSumColumns = ['id', 'client_info', 'ticker', 'stock_name', 'purchase_date'];
    const firstVisibleNonSumCol = nonSumColumns.find(colId => isVisible(colId));

    const renderColGroup = () => (
        <colgroup>
            {columnsConfig.map(col => isVisible(col.id) && (
                <col key={col.id} style={{ width: col.width }} />
            ))}
        </colgroup>
    );

    return (
        <div className="space-y-2">
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm bg-white dark:bg-slate-900 flex flex-col h-[calc(100vh-270px)] overflow-hidden">
                {/* Scrollable Body Container */}
                <div ref={bodyContainerRef} className="overflow-x-auto overflow-y-auto flex-1 min-h-0 [scrollbar-gutter:stable]">
                    <table className="w-full min-w-[1400px] text-xs text-left border-collapse table-layout-fixed" style={{ tableLayout: 'fixed' }}>
                        {renderColGroup()}
                        <thead className="bg-gray-100 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 uppercase text-gray-600 dark:text-slate-400 font-semibold transition-colors sticky top-0 z-20 shadow-sm">
                            <tr>
                                {isVisible('id') && <th className="px-3 py-3 w-16">ID</th>}
                                {isVisible('client_info') && (
                                    <th className="px-3 py-3">
                                        <button onClick={() => handleSort('client_name')} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center uppercase font-semibold">
                                            Client Info<SortArrow field="client_name" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
                                        </button>
                                    </th>
                                )}
                                {isVisible('ticker') && (
                                    <th className="px-3 py-3">
                                        <button onClick={() => handleSort('ticker')} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center uppercase font-semibold">
                                            Ticker / ISIN <SortArrow field="ticker" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
                                        </button>
                                    </th>
                                )}
                                {isVisible('stock_name') && (
                                    <th className="px-3 py-3">
                                        <button onClick={() => handleSort('stock_name')} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center uppercase font-semibold">
                                            Stock Name <SortArrow field="stock_name" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
                                        </button>
                                    </th>
                                )}
                                {isVisible('purchase_date') && <th className="px-3 py-3 text-right">Purchase Date</th>}
                                {isVisible('purchase_qty') && <th className="px-3 py-3 text-right">Purchase Qty</th>}
                                {isVisible('purchase_rate') && <th className="px-3 py-3 text-right">Purchase Rate</th>}
                                {isVisible('purchase_value') && <th className="px-3 py-3 text-right">Purchase Value</th>}
                                {isVisible('sale_date') && (
                                    <th className="px-3 py-3">
                                        <button onClick={() => handleSort('sale_date')} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center uppercase font-semibold">
                                            Date <SortArrow field="sale_date" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
                                        </button>
                                    </th>
                                )}
                                {isVisible('sale_qty') && <th className="px-3 py-3 text-right">Sale Qty</th>}
                                {isVisible('sale_rate') && <th className="px-3 py-3 text-right">Sale Rate</th>}
                                {isVisible('sale_value') && <th className="px-3 py-3 text-right">Sale Value</th>}
                                {isVisible('pl_percentage') && (
                                    <th className="px-3 py-3 text-right">
                                        <button onClick={() => handleSort('pl_percentage')} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-end w-full uppercase font-semibold">
                                            P/L % <SortArrow field="pl_percentage" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
                                        </button>
                                    </th>
                                )}
                                {isVisible('pl') && (
                                    <th className="px-3 py-3 text-right">
                                        <button onClick={() => handleSort('pl')} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-end w-full uppercase font-semibold">
                                            Total P/L <SortArrow field="pl" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
                                        </button>
                                    </th>
                                )}
                                {isVisible('grandfathered_pl') && <th className="px-3 py-3 text-right">Section 112A Baseline FMV Grandfathered P/L</th>}
                                {isVisible('term') && (
                                    <th className="px-3 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => handleSort('long_term')} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center uppercase font-semibold">
                                                Term <SortArrow field="long_term" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
                                            </button>
                                            <div className="group relative">
                                                <Info size={14} className="text-slate-400 cursor-help" />
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover/info:block w-48 p-2 bg-slate-800 dark:bg-slate-950 text-white text-[10px] rounded shadow-lg z-50 pointer-events-none normal-case tracking-normal font-normal transition-colors">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 font-normal"><span className="text-green-400">✓</span> Long Term (&gt;365 days)</div>
                                                        <div className="flex items-center gap-2 font-normal"><span className="text-red-400">✕</span> Short Term (&lt;365 days)</div>
                                                        <div className="flex items-center gap-2 font-normal"><span className="text-amber-400">⚡</span> Square Off (Same Day)</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </th>
                                )}
                                {isVisible('comments') && <th className="px-3 py-3">Comments</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                            {sales?.map((row) => (
                                <tr key={row.trx_id} className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors`}>
                                    {isVisible('id') && (
                                        <td className="px-3 py-3">
                                            <TrxIdCell id={row.trx_id} />
                                        </td>
                                    )}
                                    {isVisible('client_info') && (
                                        <td className="p-3">
                                            <div className="font-semibold text-gray-900 dark:text-white">{row.client_name}</div>
                                            <div className="text-[10px] opacity-70 dark:text-slate-400 uppercase tracking-tight font-medium">DP: {row.dp_id} | Trade: {row.trading_id}</div>
                                        </td>
                                    )}
                                    {isVisible('ticker') && <TickerCell ticker={row.ticker} isin={row.isin} />}
                                    {isVisible('stock_name') && <td className="px-3 py-3 max-w-[120px] truncate">{row.stock_name}</td>}
                                    {isVisible('purchase_date') && (
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            {new Date(row.purchase_date).toLocaleDateString('en-IN', { timeZone: 'UTC' })}
                                        </td>
                                    )}
                                    {isVisible('purchase_qty') && (
                                        <td className="px-3 py-3 text-right">
                                            {(Number(row.purchase_qty) || 0).toLocaleString('en-IN')}
                                        </td>
                                    )}
                                    {isVisible('purchase_rate') && <td className="px-3 py-3 text-right">₹{Number(row.purchase_rate).toFixed(2)}</td>}
                                    {isVisible('purchase_value') && <td className="px-3 py-3 text-right">₹{Number(row.purchase_value).toLocaleString('en-IN')}</td>}
                                    {isVisible('sale_date') && (
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            {new Date(row.sale_date).toLocaleDateString('en-IN', { timeZone: 'UTC' })}
                                        </td>
                                    )}
                                    {isVisible('sale_qty') && <td className="px-3 py-3 text-right">{Number(row.sale_qty)}</td>}
                                    {isVisible('sale_rate') && <td className="px-3 py-3 text-right">₹{Number(row.sale_rate).toFixed(2)}</td>}
                                    {isVisible('sale_value') && <td className="px-3 py-3 text-right">₹{Number(row.sale_value).toLocaleString('en-IN')}</td>}
                                    {isVisible('pl_percentage') && (
                                        <td className={`px-3 py-3 text-right font-semibold ${row.pl_percentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {Number(row.pl_percentage).toFixed(2)}%
                                        </td>
                                    )}
                                    {isVisible('pl') && (
                                        <td className={`px-3 py-3 text-right font-bold ${row.pl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            ₹{Number(row.pl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                    )}
                                    {isVisible('grandfathered_pl') && (
                                        <td className={`px-3 py-3 text-right font-bold ${row.pl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            ₹{Number(row.adjusted_pl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                    )}
                                    {isVisible('term') && (
                                        <td className="px-3 py-3 text-center">
                                            <div className="flex justify-center items-center">
                                                {row.long_term ? (
                                                    <span className="text-green-600 dark:text-green-400 font-bold" title="Long Term">✓</span>
                                                ) : row.is_square_off ? (
                                                    <span className="text-amber-500 dark:text-amber-400 font-bold" title="Square Off">⚡</span>
                                                ) : (
                                                    <span className="text-red-500 dark:text-red-400 font-bold" title="Short Term">✕</span>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    {isVisible('comments') && (
                                        <td className="px-3 py-3">
                                            <CommentCell comment={row.comments} />
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Fixed Footer Table */}
                <div ref={footerContainerRef} className="overflow-x-hidden border-t border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 shrink-0">
                    <table className="w-full min-w-[1400px] text-xs text-left border-collapse" style={{ tableLayout: 'fixed' }}>
                        {renderColGroup()}
                        <tbody>
                            <tr className="font-bold text-gray-600 dark:text-slate-300 uppercase bg-gray-100 dark:bg-slate-800">
                                {isVisible('id') && (
                                    <td className="px-3 py-3">
                                        {firstVisibleNonSumCol === 'id' ? 'Total' : ''}
                                    </td>
                                )}
                                {isVisible('client_info') && (
                                    <td className="px-3 py-3">
                                        {firstVisibleNonSumCol === 'client_info' ? 'Total' : ''}
                                    </td>
                                )}
                                {isVisible('ticker') && (
                                    <td className="px-3 py-3">
                                        {firstVisibleNonSumCol === 'ticker' ? 'Total' : ''}
                                    </td>
                                )}
                                {isVisible('stock_name') && (
                                    <td className="px-3 py-3 truncate max-w-[120px]">
                                        {firstVisibleNonSumCol === 'stock_name' ? 'Total' : ''}
                                    </td>
                                )}
                                {isVisible('purchase_date') && (
                                    <td className="px-3 py-3">
                                        {firstVisibleNonSumCol === 'purchase_date' ? 'Total' : ''}
                                    </td>
                                )}
                                {isVisible('purchase_qty') && (
                                    <td className="px-3 py-3 text-right">
                                        {totalPurchaseQty.toLocaleString('en-IN')}
                                    </td>
                                )}
                                {isVisible('purchase_rate') && <td className="px-3 py-3 text-right"></td>}
                                {isVisible('purchase_value') && (
                                    <td className="px-3 py-3 text-right">
                                        ₹{totalPurchaseValue.toLocaleString('en-IN')}
                                    </td>
                                )}
                                {isVisible('sale_date') && <td className="px-3 py-3"></td>}
                                {isVisible('sale_qty') && (
                                    <td className="px-3 py-3 text-right">
                                        {totalSaleQty.toLocaleString('en-IN')}
                                    </td>
                                )}
                                {isVisible('sale_rate') && <td className="px-3 py-3 text-right"></td>}
                                {isVisible('sale_value') && (
                                    <td className="px-3 py-3 text-right">
                                        ₹{totalSaleValue.toLocaleString('en-IN')}
                                    </td>
                                )}
                                {isVisible('pl_percentage') && <td className="px-3 py-3 text-right"></td>}
                                {isVisible('pl') && (
                                    <td className={`px-3 py-3 text-right font-bold ${totalPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        ₹{totalPL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                )}
                                {isVisible('grandfathered_pl') && (
                                    <td className={`px-3 py-3 text-right font-bold ${totalGrandfatheredPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        ₹{totalGrandfatheredPL.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                )}
                                {isVisible('term') && <td className="px-3 py-3 text-center"></td>}
                                {isVisible('comments') && <td className="px-3 py-3"></td>}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}