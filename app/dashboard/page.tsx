export default async function DashboardHome() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch Aggregated Metrics from a custom RPC or View
    // We want: Total Market Value, Total Realized Profit (FY), Total Tax Due
    const { data: metrics } = await supabase.rpc('get_portfolio_summary', { manager_uuid: user?.id });

    return (

            </div>

            </div>
        </div>
    );
}