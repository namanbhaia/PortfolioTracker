# Core Features

Portfolio Tracker is more than just a ledger; it's a sophisticated analysis engine for your investments.

## 📊 Investment Ledger (FIFO)

The system operates on a **First-In-First-Out (FIFO)** basis for all sales.
- **Batched Purchases**: Every purchase is logged as a unique "lot" with its own date and cost basis.
- **Smart Selling**: When you log a sale, the system automatically draws from the oldest available purchase lot for that specific ticker and client.
- **Partial Liquidations**: If a sale is larger than a single lot, the system splits the sale across multiple lots automatically.

## 📈 Profit/Loss Metrics

The system provides three primary metrics to analyze performance:

1. **Short-Term P/L**: Calculated for assets held for less than the long-term threshold (e.g., 1 year for equity).
2. **Long-Term P/L**: Calculated for assets held beyond the long-term holding period.
3. **Adjusted Profit**: A critical feature for Indian investors. It uses **grandfathered market prices** (as of Jan 31, 2018, or other regulatory dates) to calculate the "true" taxable gain, ensuring you don't pay tax on gains that occurred before legislation changes.

*Note: While the app provides these numbers, users should consult with a tax professional to decide final tax implications, considering external Faktoren like rollover losses.*

## 🛡 Privacy & Screensaver Mode

Designed for use in public or shared spaces, the dashboard includes a professional **Privacy Screensaver**.
- **HUD Interface**: Displays stylized market charts and system info instead of personal wealth data.
- **Custom Triggers**: Enable "Privacy Mode" manually via the sidebar logo.
- **Configurable Dismissal**: Set your preference in the **Profile** page:
    - **Default**: Resumes on any mouse or keyboard activity.
    - **Click-to-Dismiss**: Resumes ONLY on a direct click, preventing accidental dismissal by bumping the mouse.

## 🤝 Pledging Workflow

Easily track shares that have been pledged as collateral for margin or loans.
- **Pledge Form**: Log quantities of specific stocks that are currently locked.
- **Real-time Balance**: The "Open Quantity" in your holdings is automatically adjusted to show what is available vs. what is pledged.

## 🔍 Verification Engine

Reconcile your manual logs against official data.
- **NSDL/CDSL Import**: Upload CSV exports from your DP (Depository Participant).
- **Relational Impact Tracing**: The system compares your local `purchases` table against the external CSV to identify discrepancies in balances or missing transactions.

## ☁️ Market Data Integration

The system leverages **Yahoo Finance** to fetch the latest market prices.
- **Ticker Mapping**: Supports both standard tickers and ISIN lookups.
- **Automated Sync**: A background cron job periodically updates the `assets` table to ensure your portfolio valuation is always current.
