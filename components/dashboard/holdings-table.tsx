import Link from "next/link";
import TrxIdCell from "@/components/ui/trx-id-cell";
import CommentCell from "@/components/ui/comment-cell";

/**
 * @file components/dashboard/holdings-table.tsx
 * @description This component renders a sortable table of individual investment holdings.
 * It is a client component that receives data fetched from a server component.
 *
 * @feature Sorting: Table headers are clickable links that update URL search parameters to trigger server-side sorting.
 * @feature Conditional Styling: Rows are styled differently based on data (e.g., positive/negative P/L, zero balance).
 * @feature Component Composition: Uses smaller, specialized components like `TrxIdCell` and `CommentCell` for specific cell rendering.
 * @feature Data Formatting: Formats dates and currency values for readability.
 */

// Define the valid column names that can be used for sorting. This provides type safety.
type SortField = "client_name" | "ticker" | "stock_name" | "date" | "pl_percent" | "pl" | "is_long_term";

// Define the props structure for the HoldingsTable component.
interface HoldingsTableProps {
	holdings: any[]; // The array of holding data to display.
	params: {
		// Current URL search parameters for sorting.
		sort?: string;
		order?: string;
	};
}

export default function HoldingsTable({ holdings, params }: HoldingsTableProps) {
	/**
	 * @function getSortLink
	 * @description A helper function to generate the correct URL for sorting a column.
	 * It toggles the sort order (asc/desc) if the same column header is clicked again.
	 * @param {SortField} field - The column to sort by.
	 * @returns {string} - The URL search string for the sort action.
	 */
	const currentSort = params.sort;
    const currentOrder = params.order;
	const getSortLink = (field: SortField) => {
		const newOrder = currentSort === field && currentOrder === "asc" ? "desc" : "asc";
		return `?sort=${field}&order=${newOrder}`;
	};

	/**
	 * @component SortArrow
	 * @description A small helper component to display a sort direction indicator (↑, ↓, or ↕).
	 * It shows an up or down arrow if the column is actively sorted, or a double arrow otherwise.
	 */
	const SortArrow = ({ field }: { field: SortField }) => {
		if (currentSort !== field) return <span className="text-gray-300 ml-1">↕</span>;
		return currentOrder === "asc" ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
	};

	return (
		<div className="border rounded-lg shadow-sm bg-white overflow-x-auto">
			<table className="w-full text-xs text-left border-collapse">
				{/* Table Header */}
				<thead className="bg-gray-100 border-b uppercase text-gray-600 font-semibold">
					<tr>
						<th className="px-3 py-3 w-16">ID</th>
						{/* Sortable Header: Client Name */}
						<th className="px-3 py-3">
							<Link href={getSortLink("client_name")} className="hover:text-blue-600 flex items-center">
								Client Info
								<SortArrow field="client_name" />
							</Link>
						</th>
						{/* Sortable Header: Ticker */}
						<th className="px-3 py-3">
							<Link href={getSortLink("ticker")} className="hover:text-blue-600 flex items-center">
								Ticker / ISIN <SortArrow field="ticker" />
							</Link>
						</th>
						{/* Sortable Header: Stock Name */}
						<th className="px-3 py-3">
							<Link href={getSortLink("stock_name")} className="hover:text-blue-600 flex items-center">
								Stock Name <SortArrow field="stock_name" />
							</Link>
						</th>
						{/* Sortable Header: Date */}
						<th className="px-3 py-3">
							<Link href={getSortLink("date")} className="hover:text-blue-600 flex items-center">
								Date <SortArrow field="date" />
							</Link>
						</th>
						{/* Non-sortable numeric columns */}
						<th className="px-3 py-3 text-right">Purchase Qty</th>
						<th className="px-3 py-3 text-right">Rate</th>
						<th className="px-3 py-3 text-right">Value</th>
						<th className="px-3 py-3 text-right">Bal Qty</th>
						<th className="px-3 py-3 text-right">Mkt Rate</th>
						<th className="px-3 py-3 text-right">Mkt Value</th>
						{/* Sortable Header: P/L % */}
						<th className="px-3 py-3 text-right">
							<Link href={getSortLink("pl_percent")} className="hover:text-blue-600 flex items-center justify-end">
								P/L % <SortArrow field="pl_percent" />
							</Link>
						</th>
						{/* Sortable Header: Total P/L */}
						<th className="px-3 py-3 text-right">
							<Link href={getSortLink("pl")} className="hover:text-blue-600 flex items-center justify-end">
								Total P/L <SortArrow field="pl" />
							</Link>
						</th>
						{/* Sortable Header: Type (Long Term) */}
						<th className="px-3 py-3 text-center">
							<Link href={getSortLink("is_long_term")} className="hover:text-blue-600 flex items-center justify-center">
								Long Term <SortArrow field="is_long_term" />
							</Link>
						</th>
						<th className="px-3 py-3">Comments</th>
					</tr>
				</thead>
				{/* Table Body */}
				<tbody className="divide-y divide-gray-200">
					{holdings?.map(row => (
						// Each row is keyed by a unique transaction ID.
						// A faded style is applied to rows with zero balance quantity, indicating a closed position.
						<tr key={row.trx_id} className={`hover:bg-gray-50 ${row.balance_qty === 0 ? "bg-gray-50/50 opacity-70" : ""}`}>
							{/* Transaction ID Cell */}
							<td className="px-3 py-3">
								<TrxIdCell id={row.trx_id} />
							</td>
							{/* Client and Account Info */}
							<td className="p-3">
								<div className="font-semibold text-gray-900">{row.client_name}</div>
								<div className="text-[10px] opacity-70">
									DP: {row.dp_id} | Trade: {row.trading_id}
								</div>
							</td>
							{/* Ticker and ISIN */}
							<td className="px-3 py-3">
								<div className="font-bold text-blue-700">{row.ticker}</div>
								<div className="text-[10px] text-gray-400">{row.isin}</div>
							</td>
							<td className="px-3 py-3 max-w-[120px] truncate">{row.stock_name}</td>
							{/* Purchase Date */}
							<td className="px-3 py-3 whitespace-nowrap">{new Date(row.date).toLocaleDateString("en-IN")}</td>
							{/* Numeric Data (Right Aligned) */}
							<td className="px-3 py-3 text-right">{Number(row.purchase_qty)}</td>
							<td className="px-3 py-3 text-right">₹{Number(row.rate).toFixed(2)}</td>
							<td className="px-3 py-3 text-right">₹{Number(row.purchase_value).toLocaleString("en-IN")}</td>
							<td className="px-3 py-3 text-right">{row.balance_qty}</td>
							<td className="px-3 py-3 text-right text-indigo-600">₹{Number(row.market_rate).toFixed(2)}</td>
							<td className="px-3 py-3 text-right font-bold">₹{Number(row.market_value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
							{/* P/L Percentage (Colored) */}
							<td className={`px-3 py-3 text-right font-semibold ${row.pl_percent >= 0 ? "text-green-600" : "text-red-600"}`}>{Number(row.pl_percent).toFixed(2)}%</td>
							{/* Total P/L (Colored) */}
							<td className={`px-3 py-3 text-right font-bold ${row.pl >= 0 ? "text-green-600" : "text-red-600"}`}>
								₹{Number(row.pl).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
							</td>
							{/* Long Term Status */}
							<td className="px-3 py-3 text-center">
								<div className="flex justify-center items-center">
									<span className={row.is_long_term ? "text-green-600" : "text-red-500"}>{row.is_long_term ? "✓" : "✕"}</span>
								</div>
							</td>
							{/* Comments Cell */}
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