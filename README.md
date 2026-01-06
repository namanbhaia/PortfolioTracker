WealthTrack Manager (2026)Multi-Entity Financial Portfolio & Tax EngineWealthTrack Manager is a high-performance, private investment dashboard designed for managing complex family wealth. Built with Next.js 16 and Supabase, it allows a single manager to oversee multiple "Clients" (family accounts), track individual purchase "lots," and view consolidated exposure—all while calculating Indian Capital Gains tax in real-time.🚀 Key FeaturesHierarchical Management: Manage multiple independent clients (e.g., Personal, Spouse, Parents) under one secure login.The "Lot-Level" Ledger: Tracks every buy as a unique batch, allowing for precise First-In-First-Out (FIFO) selling and tax optimization.Automated Tax Logic: Built-in engine for LTCG (12.5%) and STCG (20%) based on the 2024-26 Indian Union Budget rules.Consolidated Holdings: A unique "Union" view that aggregates a specific stock's exposure across all selected family accounts.Edge-Powered Market Data: Automated price fetching via Supabase Edge Functions and pg_cron schedules.🛠 Tech StackLayerTechnologyPurposeFrontendNext.js 16 (App Router)Server-side rendering for fast data fetching.StylingTailwind CSS + shadcn/uiClean, high-density financial UI.DatabasePostgreSQL (Supabase)Relational engine for transactions and complex views.AuthSupabase AuthSecure username/password management.AutomationSupabase Edge FunctionsPeriodic market price updates via CRON.📂 Project StructurePlaintext/app
  /dashboard
    /holdings       # Active "Open" positions
    /sales          # Realized P&L history
    /ledger         # New transaction entry (Buy/Sell)
    /consolidated   # Multi-client aggregated view
/components
  /dashboard        # Complex UI (Tables, Charts)
  /forms            # Transaction & Modal logic
/lib
  /calculations.ts  # Shared Tax & P&L math
/supabase
  /functions        # Market data update engine
🏗 Database ArchitectureThe system uses PostgreSQL Views to perform heavy financial math at the database level rather than the client level:user_holdings (View): Joins purchases and sales to calculate balance_qty and potential_profit.sales_view (View): Pairs every sale with its specific purchase lot to calculate realized gains and tax_payable.🏁 Getting Started1. PrerequisitesNode.js 22+Supabase AccountMarket Data API Key (e.g., Alpha Vantage or Dhan)2. Environment VariablesCreate a .env.local file:BashNEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
MARKET_DATA_API_KEY=your_key
3. Setup DatabaseRun the Master SQL Script in the Supabase SQL Editor to create tables and views.Enable Row Level Security (RLS) to protect client data.Deploy the Edge Function:Bashsupabase functions deploy update-prices
📊 Decision IntelligenceThis app is built to answer three questions every morning:"What is our total family exposure to this asset?" (Consolidated View)"How much tax do I owe if I sell today?" (Holdings/Sales Tables)"Which account is under-allocated?" (Dashboard Summary)