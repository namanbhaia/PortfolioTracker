import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, PieChart } from "lucide-react";
import { ClientFilter } from "@/components/ui/client-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ConsolidatedHoldingsTable from "@/components/dashboard/consolidated-holdings-table";
import { RefreshButton } from "@/components/ui/refresh-button";

/**
 * @file app/dashboard/page.tsx
 * @description This is the main dashboard page, also known as the "Executive Summary" or "Consolidated View".
 * It serves as a server component to fetch and aggregate financial data for a logged-in user.
 *
 * @feature Server-Side Data Fetching: Securely fetches data using the Supabase server client.
 * @feature User Authentication: Redirects unauthenticated users to the login page.
 * @feature Multi-Client Data Aggregation: Fetches holdings from all clients linked to the user's profile.
 * @feature Dynamic Filtering: Filters the aggregated data based on client names passed in URL search parameters.
 * @feature Data Aggregation: "Rolls up" individual holdings by ticker to provide a consolidated view of exposure.
 * @feature Executive Summary Metrics: Calculates and displays key portfolio metrics like total investment, current value, and P/L.
 */

// Define the expected shape of the props, particularly the URL search parameters.
interface DashboardProps {
	searchParams: Promise<{ clients?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
	// Initialize the Supabase server client for secure, server-side data access.
	const supabase = await createClient();
	// Resolve the search parameters from the URL (e.g., ?clients=ClientA,ClientB).
	const params = await searchParams;

	// --- 1. User Authentication ---
	// Fetch the current user session. If no user is found, redirect to the login page.
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	// --- 2. Fetch User Profile ---
	// Retrieve the user's profile to get their full name and a list of client_ids they are authorized to view.
	const { data: profile } = await supabase.from("profiles").select("full_name, client_ids").eq("id", user.id).single();

	// If the user has no profile or is not linked to any clients, display a message.
	if (!profile || !profile.client_ids || profile.client_ids.length === 0) {
		return (
			<div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
				<Users className="mx-auto text-slate-300 mb-4" size={48} />
				<h2 className="text-xl font-bold text-slate-700">No Linked Accounts</h2>
				<p className="text-slate-500 text-sm">Please link family clients to your profile to view data.</p>
			</div>
		);
	}

	// --- 4. Fetch and Filter Holdings Data ---
	// Start building the query to fetch holdings from the `client_holdings` view.
	// The base query is restricted to the user's authorized `client_id`s and only includes assets with a positive balance.
	let query = supabase.from("client_holdings").select("*").in("client_id", profile.client_ids).gt("balance_qty", 0);

	// Parse the `clients` search parameter from the URL.
	// If specific client names are provided, add a filter to the query.
	const selectedNames = params.clients ? params.clients.split(",").filter(Boolean) : [];
	if (selectedNames.length > 0) {
		query = query.in("client_name", selectedNames);
	}

	// Execute the query.
	const { data: rawHoldings, error } = await query;

	// Log any errors to the server console for debugging.
	if (error) {
		console.error("Dashboard Fetch Error:", error.message);
	}

	// --- 5. Aggregate Data by Ticker ---
	// This is the core logic for the consolidated view. It groups all individual holdings
	// from different clients by their stock ticker.
	const aggregatedMap = (rawHoldings || []).reduce((acc: any, curr) => {
		const key = curr.ticker;
		// If this is the first time we see this ticker, initialize its entry.
		if (!acc[key]) {
			acc[key] = {
				ticker: curr.ticker,
				isin: curr.isin,
				stock_name: curr.stock_name,
				total_qty: 0,
				total_purchase_value: 0,
				market_rate: Number(curr.market_rate),
				total_market_value: 0,
			};
		}

		// Add the current holding's quantity and value to the aggregated totals.
		const qty = Number(curr.balance_qty);
		const purchaseRate = Number(curr.rate || curr.purchase_rate); // Use a fallback for rate column name.

		acc[key].total_qty += qty;
		acc[key].total_purchase_value += qty * purchaseRate;
		acc[key].total_market_value += qty * Number(curr.market_rate);

		return acc;
	}, {});

	// Convert the aggregated map into an array and calculate derived metrics like P/L.
	const consolidatedRows = Object.values(aggregatedMap)
		.map((item: any) => {
			const avg_purchase_price = item.total_purchase_value / item.total_qty;
			const pl = item.total_market_value - item.total_purchase_value;
			const pl_percent = item.total_purchase_value > 0 ? (pl / item.total_purchase_value) * 100 : 0;
			return {
				...item,
				avg_purchase_price,
				pl,
				pl_percent,
			};
		})
		.sort((a, b) => a.ticker.localeCompare(b.ticker)); // Sort alphabetically by ticker.

	// --- 6. Calculate Global Portfolio Metrics ---
	// Compute the high-level summary numbers for the entire selected portfolio.
	const totalInvested = consolidatedRows.reduce((acc, row) => acc + row.total_purchase_value, 0);
	const currentTotalValue = consolidatedRows.reduce((acc, row) => acc + row.total_market_value, 0);
	const totalPL = currentTotalValue - totalInvested;
	const plPercentage = totalInvested > 0 ? totalPL / totalInvested : 0;

    return (
        <div className="p-6 space-y-8 mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Executive Summary</h1>
                    <p className="text-sm text-slate-500">
                        Consolidated overview for <span className="font-semibold text-indigo-600">{profile.full_name}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <RefreshButton/>
                    <ClientFilter
                        currentSelection={selectedNames}
                    />
                </div>
            </header>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Invested</CardTitle>
                        <Wallet className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Current Value</CardTitle>
                        <PieChart className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-600">₹{currentTotalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Possible P/L</CardTitle>
                        <TrendingUp className={`h-4 w-4 ${totalPL >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{totalPL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                        <p className={`text-xs font-bold flex items-center mt-1 ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalPL >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {plPercentage.toFixed(2)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* CONSOLIDATED HOLDINGS TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Union of Family Holdings</h3>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-md">
                        {consolidatedRows.length} TICKERS
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <ConsolidatedHoldingsTable consolidatedRows={consolidatedRows || []} />

                    {consolidatedRows.length === 0 && (
                        <tr>
                            <td colSpan={9} className="py-20 text-center text-slate-400 italic">
                                No holdings found for the selected accounts.
                            </td>
                        </tr>
                    )}
                </div>
            </div>
        </div>
    );
}