/**
 * @file holdings-table.tsx
 * @description Renders a detailed table of individual purchase transactions (holdings) with sorting.
 */

import TrxIdCell from "@/components/ui/trx-id-cell";
import CommentCell from "@/components/ui/comment-cell";
import TickerCell from "@/components/ui/ticker-cell";
import SortArrow from "@/components/ui/sort-arrow";
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
			<div className="border rounded-lg shadow-sm bg-white overflow-x-auto">
				<table className="w-full text-xs text-left border-collapse">
					{/* Table Header */}
					<thead className="bg-gray-100 border-b uppercase text-gray-600 font-semibold">
						<tr>
							{isVisible("id") && <th className="px-3 py-3 w-16">ID</th>}
							{isVisible("client_info") && (
								<th className="px-3 py-3">
									<button onClick={() => handleSort("client_name")} className="hover:text-blue-600 flex items-center uppercase font-semibold">
										Client Info
										<SortArrow field="client_name" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
									</button>
								</th>
							)}
							{isVisible("ticker") && (
								<th className="px-3 py-3">
									<button onClick={() => handleSort("ticker")} className="hover:text-blue-600 flex items-center uppercase font-semibold">
										Ticker / ISIN <SortArrow field="ticker" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
									</button>
								</th>
							)}
							{isVisible("stock_name") && (
								<th className="px-3 py-3">
									<button onClick={() => handleSort("stock_name")} className="hover:text-blue-600 flex items-center uppercase font-semibold">
										Stock Name <SortArrow field="stock_name" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
									</button>
								</th>
							)}
							{isVisible("date") && (
								<th className="px-3 py-3">
									<button onClick={() => handleSort("date")} className="hover:text-blue-600 flex items-center uppercase font-semibold">
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
									<button onClick={() => handleSort("pl_percent")} className="hover:text-blue-600 flex items-center justify-end w-full uppercase font-semibold">
										P/L % <SortArrow field="pl_percent" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
									</button>
								</th>
							)}
							{isVisible("pl") && (
								<th className="px-3 py-3 text-right">
									<button onClick={() => handleSort("pl")} className="hover:text-blue-600 flex items-center justify-end w-full uppercase font-semibold">
										Total P/L <SortArrow field="pl" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
									</button>
								</th>
							)}
							{isVisible("long_term") && (
								<th className="px-3 py-3 text-center">
									<button onClick={() => handleSort("long_term")} className="hover:text-blue-600 flex items-center justify-center w-full uppercase font-semibold">
										Long Term <SortArrow field="long_term" currentSort={sortConfig?.key} currentOrder={sortConfig?.direction} />
									</button>
								</th>
							)}
							{isVisible("comments") && <th className="px-3 py-3">Comments</th>}
						</tr>
					</thead>
					{/* Table Body */}
					<tbody className="divide-y divide-gray-200">
						{holdings?.map(row => (
							<tr key={row.trx_id} className={`hover:bg-gray-50 ${row.balance_qty === 0 ? "bg-gray-50/50 opacity-70" : ""}`}>
								{isVisible("id") && (
									<td className="px-3 py-3">
										<TrxIdCell id={row.trx_id} />
									</td>
								)}
								{isVisible("client_info") && (
									<td className="p-3">
										<div className="font-semibold text-gray-900">{row.client_name}</div>
										<div className="text-[10px] opacity-70">
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
								{isVisible("mkt_rate") && <td className="px-3 py-3 text-right text-indigo-600">₹{Number(row.market_rate).toFixed(2)}</td>}
								{isVisible("mkt_value") && <td className="px-3 py-3 text-right font-bold">₹{Number(row.market_value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>}
								{isVisible("pl_percent") && <td className={`px-3 py-3 text-right font-semibold ${row.pl_percent >= 0 ? "text-green-600" : "text-red-600"}`}>{Number(row.pl_percent).toFixed(2)}%</td>}
								{isVisible("pl") && (
									<td className={`px-3 py-3 text-right font-bold ${row.pl >= 0 ? "text-green-600" : "text-red-600"}`}>
										₹{Number(row.pl).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
									</td>
								)}
								{isVisible("long_term") && (
									<td className="px-3 py-3 text-center">
										<div className="flex justify-center items-center">
											<span className={row.long_term ? "text-green-600" : "text-red-500"}>{row.long_term ? "✓" : "✕"}</span>
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