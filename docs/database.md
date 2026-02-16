# Database Schema

Portfolio Tracker utilizes a relational database (PostgreSQL via Supabase) designed to handle complex financial transactions with high integrity and performance.

## 📊 Entity Relationship Summary

The schema centers around the **Batch/Lot** concept. Instead of a single "holdings" table, the system derives balances by comparing "purchases" (inputs) vs "sales" (outputs).

## 🗂 Tables

### 1. `profiles`
Stores the high-level manager accounts.
- `id`: Link to Supabase Auth.
- `screensaver_click_only`: Boolean for privacy preference.

### 2. `clients`
Represents individual folders or family members.
- `client_name`: Primary key (unique identifier).
- `trading_id` / `dp_id`: Official identifiers for reconciliation.

### 3. `assets`
The master catalog of securities.
- `ticker`: Ticker symbol (e.g., `RELIANCE.NS`).
- `current_price`: Last fetched price from market data providers.

### 4. `purchases`
The source of truth for the cost basis.
- `trx_id`: Unique lot ID.
- `rate`: Buy price.
- `qty`: Original quantity purchased.
- `balance_qty`: Current remaining quantity in this specific lot.
- `sale_ids`: Array of UUIDs linking to sales that drew from this lot.

### 5. `sales`
The record of liquidations.
- `purchase_trx_id`: Link to the specific buy lot being sold (FIFO).
- `profit_stored`: Calculated gain at the moment of sale.
- `adjusted_profit_stored`: Gain adjusted for grandfather rates.

### 6. `pledges`
Tracks the restricted portion of holdings.
- `pledged_qty`: Amount of stock currently locked as collateral.

---

## ⚡ Computed Views

The system performs heavy math at the database layer using views. This ensures consistency across different parts of the UI.

### `client_holdings`
- **Purpose**: Power the main Dashboard and Holdings table.
- **Calculations**: Market Value, Unrealized P&L, P&L %, and Days Held.
- **Logic**: Joins `purchases` (where `balance_qty > 0`) with `assets` (current price).

### `sales_view`
- **Purpose**: Power the Sales Ledger and Tax-readiness reports.
- **Calculations**: Realized Gain, Holding Period (LT/ST classification), and Sale Value.
- **Logic**: Joins `sales` with their parent `purchases` to retrieve original cost bases.

---

## 🔒 Row Level Security (RLS)

All tables are protected by RLS. 
- **Ownership**: Every sensitive record (`purchases`, `sales`, `clients`) contains a `user_id` column.
- **Policy**: `auth.uid() = user_id`.
- **Managers**: Profiles are automatically linked to `auth.users` via a database trigger.
