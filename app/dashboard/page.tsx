// Logic: Aggregate data from the Holdings View and Sales View
export default async function DashboardHome() {
    // 1. Fetch Summary Data (Server Component)
    // const { totalValue, totalProfit, taxLiability } = await getPortfolioSummary();

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Portfolio Overview (INR)</h1>

            {/* Top Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatsCard title="Total Net Worth" value="₹45,20,000" trend="+2.4%" />
                <StatsCard title="Realized Profit (FY 25-26)" value="₹3,40,000" />
                <StatsCard title="Est. Tax Liability" value="₹42,500" variant="warning" />
            </div>

            {/* Decision Widget: Why invest next? */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h3 className="font-semibold">Next Investment Opportunity</h3>
                <p className="text-sm">Client "Dad's IRA" is currently 15% below target in Energy sector. Consider RELIANCE or ONGC.</p>
            </div>
        </div>
    );
}