
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InfoPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">About WealthTrack Manager</h1>

      <Card>
        <CardHeader>
          <CardTitle>What is this?</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            WealthTrack Manager is a specialized dashboard designed for individuals managing financial portfolios for multiple family members. It provides a centralized view of all investments, tracks performance, and automates tax calculations based on Indian tax laws.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How to Get Started</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-4 pl-5">
            <li>
              <strong>Sign Up</strong>: Create a manager account. This will be your central login to oversee all client portfolios.
            </li>
            <li>
              <strong>Add Clients</strong>: In the main dashboard, you can add each family member as a "Client," linking their unique trading and DP IDs.
            </li>
            <li>
              <strong>Log Transactions</strong>: Navigate to the <strong>Ledger</strong> tab to begin entering individual buy and sell transactions for each client.
            </li>
            <li>
              <strong>View Holdings</strong>: The <strong>Holdings</strong> tab shows you all the current open positions, with real-time market data and profit/loss calculations.
            </li>
            <li>
              <strong>Analyze Sales</strong>: The <strong>Sales</strong> tab provides a detailed history of all realized gains, along with the calculated short-term and long-term capital gains tax for each transaction.
            </li>
            <li>
              <strong>Consolidate View</strong>: Use the <strong>Consolidated</strong> tab to see the total family exposure to a single stock across all client accounts.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
