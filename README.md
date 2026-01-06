# PortfolioTracker
Web application to track stock portfolio

File Structure: 
/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx             # Login & Auth Logic
│   ├── dashboard/
│   │   ├── layout.tsx                 # Sidebar & Client Selector
│   │   ├── page.tsx                   # Home: Performance Summary & Alerts
│   │   ├── holdings/page.tsx          # Holdings View (The "Open" trades)
│   │   ├── sales/page.tsx             # Sales View (The "Closed" trades)
│   │   └── ledger/page.tsx            # Purchase/Sale Entry Forms
│   ├── info/page.tsx                  # About/FAQ Page
│   └── layout.tsx                     # Global Root Layout
├── components/
│   ├── dashboard/
│   │   ├── stats-cards.tsx            # Total Net Worth, Realized Profit
│   │   ├── holdings-table.tsx         # The Logic-heavy Table
│   │   └── decision-engine.tsx        # Buy/Sell Suggestion Widget
│   └── forms/
│       ├── purchase-form.tsx
│       └── sale-form.tsx
├── lib/
│   ├── db.ts                          # Supabase/PostgreSQL client
│   └── calculations.ts                # Shared math (LTCG, Unrealized Profit)
└── types/
    └── index.ts                       # TypeScript interfaces for Holdings/Sales