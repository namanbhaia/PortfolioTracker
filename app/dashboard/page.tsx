import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClientWrapper from "@/components/dashboard/dashboard-client-wrapper";

/**
 * @file app/dashboard/page.tsx
 * @description This is the main dashboard page, also known as the "Executive Summary" or "Consolidated View".
 * Fetch all authorized data once and delegate filtering/aggregation to the client.
 */

export default async function DashboardPage() {
	// Initialize the Supabase server client.
	const supabase = await createClient();

	// --- 1. User Authentication ---
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect("/login");

	// --- 2. Fetch User Profile ---
	// Retrieve the user's profile to get their full name and a list of client_ids they are authorized to view.
	const { data: profile } = await supabase.from("profiles").select("full_name, client_ids").eq("id", user.id).single();

	if (!profile || !profile.client_ids || profile.client_ids.length === 0) {
		return (
			<div className="p-10 text-center bg-white rounded-2xl border border-dashed border-slate-300">
				<h2 className="text-xl font-bold text-slate-700">No Linked Accounts</h2>
				<p className="text-slate-500 text-sm">Please link family clients to your profile to view data.</p>
			</div>
		);
	}

	// --- 3. Fetch All Necessary Data ---
	// Fetch all authorized holdings, pledges, and client metadata.
	// Note: Pledges are linked by client_name in this schema.
	const { data: authorizedClients } = await supabase
		.from("clients")
		.select("client_id, client_name")
		.in("client_id", profile.client_ids);

	const clientNames = authorizedClients?.map(c => c.client_name) || [];

	const [holdingsResult, pledgesResult] = await Promise.all([
		supabase.from("client_holdings").select("*").in("client_id", profile.client_ids).gt("balance_qty", 0),
		supabase.from("pledges").select("*").in("client_name", clientNames)
	]);

	if (holdingsResult.error) console.error("Holdings Fetch Error:", holdingsResult.error.message);
	if (pledgesResult.error) console.error("Pledges Fetch Error:", pledgesResult.error.message);

	return (
		<DashboardClientWrapper
			initialHoldings={holdingsResult.data || []}
			initialPledges={pledgesResult.data || []}
			availableClients={authorizedClients || []}
			userName={profile.full_name || "User"}
		/>
	);
}
