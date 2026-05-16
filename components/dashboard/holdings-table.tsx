/**
 * @file holdings-table.tsx
 * @description Renders a detailed table of individual purchase transactions (holdings) with sorting.
 */

import TrxIdCell from "@/components/tables/trx-id-cell";
import CommentCell from "@/components/tables/comment-cell";
import TickerCell from "@/components/tables/ticker-cell";
import SortArrow from "@/components/tables/sort-arrow";
import type { SortFieldHoldings } from "@/app/dashboard/holdings/holdings-client-wrapper";
interface HoldingsTableProps {
	holdings: Record<string, any>[];
	sortConfig?: {
		key: string;
		direction: 'asc' | 'desc';
	};
	onSort?: (key: SortFieldHoldings) => void;
}

export const holdings_columns = [
	{ id: "id", label: "ID" },
	{ id: "client_info", label: "Client Info" },
	{ id: "ticker", label: "Ticker / ISIN" },
	{ id: "stock_name", label: "Stock Name" },
	{ id: "date", label: "Date" },
	{ id: "purchase_qty", label: "Purchase Qty" },
	{ id: "rate", label: "Rate" },
	{ id: "value", label: "Value" },
	{ id: "bal_qty", label: "Bal Qty" },
	{ id: "mkt_rate", label: "Mkt Rate" },
	{ id: "mkt_value", label: "Mkt Value" },
	{ id: "pl_percent", label: "P/L %" },
	{ id: "pl", label: "Total P/L" },
	{ id: "long_term", label: "Long Term" },
	{ id: "comments", label: "Comments" },
];

/**
 * Component for displaying the detailed holdings table.
 * @param {HoldingsTableProps} props - Component props.
 */
export default function HoldingsTable({ holdings, sortConfig, onSort, isVisible }: HoldingsTableProps & { isVisible: (id: string) => boolean }) {
	const handleSort = (field: SortFieldHoldings) => {
		if (onSort) onSort(field);
	};

	return (
		<div className="space-y-2">
			<div className="border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm bg-white dark:bg-slate-900 overflow-x-auto h-[calc(100vh-160px)] overflow-y-auto relative">
				<table className="w-full min-w-[1200px] text-xs text-left border-collapse">
					{/* Table Header */}
					<thead className="bg-gray-100 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 uppercase text-gray-600 dark:text-slate-400 font-semibold transition-colors sticky top-0 z-20 shadow-sm">
						<tr>
							{isVisible("id") && <th className="px-3 py-3 w-16">ID</th>}
							{isVisible("client_info") && (
								<th className="px-3 py-3">
									<button onClick={() => handleSort("client_name")} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center uppercase font-semibold">
										Client Info
										<SortArrow field="client_name" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
									</button>
								</th>
							)}
							{isVisible("ticker") && (
								<th className="px-3 py-3">
									<button onClick={() => handleSort("ticker")} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center uppercase font-semibold">
										Ticker / ISIN <SortArrow field="ticker" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
									</button>
								</th>
							)}
							{isVisible("stock_name") && (
								<th className="px-3 py-3">
									<button onClick={() => handleSort("stock_name")} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center uppercase font-semibold">
										Stock Name <SortArrow field="stock_name" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
									</button>
								</th>
							)}
							{isVisible("date") && (
								<th className="px-3 py-3">
									<button onClick={() => handleSort("date")} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center uppercase font-semibold">
										Date <SortArrow field="date" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
									</button>
								</th>
							)}
							{isVisible("purchase_qty") && <th className="px-3 py-3 text-right">Purchase Qty</th>}
							{isVisible("rate") && <th className="px-3 py-3 text-right">Rate</th>}
							{isVisible("value") && <th className="px-3 py-3 text-right">Value</th>}
							{isVisible("bal_qty") && <th className="px-3 py-3 text-right">Bal Qty</th>}
							{isVisible("mkt_rate") && <th className="px-3 py-3 text-right">Mkt Rate</th>}
							{isVisible("mkt_value") && <th className="px-3 py-3 text-right">Mkt Value</th>}
							{isVisible("pl_percent") && (
								<th className="px-3 py-3 text-right">
									<button onClick={() => handleSort("pl_percent")} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-end w-full uppercase font-semibold">
										P/L % <SortArrow field="pl_percent" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
									</button>
								</th>
							)}
							{isVisible("pl") && (
								<th className="px-3 py-3 text-right">
									<button onClick={() => handleSort("pl")} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-end w-full uppercase font-semibold">
										Total P/L <SortArrow field="pl" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
									</button>
								</th>
							)}
							{isVisible("long_term") && (
								<th className="px-3 py-3 text-center">
									<button onClick={() => handleSort("long_term")} className="hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center w-full uppercase font-semibold">
										Long Term <SortArrow field="long_term" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
									</button>
								</th>
							)}
							{isVisible("comments") && <th className="px-3 py-3">Comments</th>}
						</tr>
					</thead>
					{/* Table Body */}
					<tbody className="divide-y divide-gray-200 dark:divide-slate-800">
						{holdings?.map(row => (
							<tr key={row.trx_id} className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${row.balance_qty === 0 ? "bg-gray-50/50 dark:bg-slate-900/50 opacity-70" : ""}`}>
								{isVisible("id") && (
									<td className="px-3 py-3">
										<TrxIdCell id={row.trx_id} />
									</td>
								)}
								{isVisible("client_info") && (
									<td className="p-3">
										<div className="font-semibold text-gray-900 dark:text-white">{row.client_name}</div>
										<div className="text-[10px] opacity-70 dark:text-slate-400">
											DP: {row.dp_id} | Trade: {row.trading_id}
										</div>
									</td>
								)}
								{isVisible("ticker") && <TickerCell ticker={row.ticker} isin={row.isin} />}
								{isVisible("stock_name") && <td className="px-3 py-3 max-w-[120px] truncate">{row.stock_name}</td>}
								{isVisible("date") && <td className="px-3 py-3 whitespace-nowrap">{new Date(row.date).toLocaleDateString("en-IN", { timeZone: 'UTC' })}</td>}
								{isVisible("purchase_qty") && <td className="px-3 py-3 text-right">{Number(row.purchase_qty)}</td>}
								{isVisible("rate") && <td className="px-3 py-3 text-right">₹{Number(row.rate).toFixed(2)}</td>}
								{isVisible("value") && <td className="px-3 py-3 text-right">₹{Number(row.purchase_value).toLocaleString("en-IN")}</td>}
								{isVisible("bal_qty") && <td className="px-3 py-3 text-right">{row.balance_qty}</td>}
								{isVisible("mkt_rate") && <td className="px-3 py-3 text-right text-indigo-600 dark:text-indigo-400 transition-colors">₹{Number(row.market_rate).toFixed(2)}</td>}
								{isVisible("mkt_value") && <td className="px-3 py-3 text-right font-bold transition-colors">₹{Number(row.market_value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>}
								{isVisible("pl_percent") && <td className={`px-3 py-3 text-right font-semibold transition-colors ${row.pl_percent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{Number(row.pl_percent).toFixed(2)}%</td>}
								{isVisible("pl") && (
									<td className={`px-3 py-3 text-right font-bold transition-colors ${row.pl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
										₹{Number(row.pl).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
									</td>
								)}
								{isVisible("long_term") && (
									<td className="px-3 py-3 text-center">
										<div className="flex justify-center items-center">
											<span className={`transition-colors ${row.long_term ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{row.long_term ? "✓" : "✕"}</span>
										</div>
									</td>
								)}
								{isVisible("comments") && (
									<td className="px-3 py-3">
										<CommentCell comment={row.comments} />
									</td>
								)}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}