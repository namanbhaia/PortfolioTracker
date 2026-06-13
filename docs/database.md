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
- `purchase_trx_id`: Link to the specific buy lot being sold (Temporal First-In-First-Out (FIFO) cost basis allocation).
- `profit_stored`: Calculated gain at the moment of sale.
- `adjusted_profit_stored`: Gain adjusted for Section 112A Baseline FMV Grandfathered Rates.

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

## 🔒 Row Level Security (RLS) Policies

All tables are protected by Row Level Security (RLS). The following policies are active:

### 1. Profiles
- **View Own Profile**: Users can only see their own profile data. (`auth.uid() = id`)
- **Update Own Profile**: Users can only update their own profile data. (`auth.uid() = id`)
- **Public Lookup**: Allows public selection of usernames for verification.

### 2. Clients
- **Authorized View**: Users can only see clients whose IDs are in their profile's `client_ids` array.
- **Profile Array Access**: Grants full access (ALL) to clients owned by the authenticated profile.

### 3. Assets
- **Public Read**: Anyone can read the asset catalog.
- **Admin Manage**: Only users with `admin_level >= 1` can insert, update, or delete assets.

### 4. Purchases
- **Authorized View**: Users can view purchases for any client linked to their profile.
- **Authorized Insert**: Users can only record purchases for clients they own.
- **Authorized Update**: Users can update their own purchases if the client is authorized.
- **Authorized Manage**: Full CRUD access for authorized family purchases.

### 5. Sales
- **Authorized Manage**: Full CRUD access for sales records linked to authorized clients.

### 6. Pledges
- **Authorized Manage**: Full CRUD access for pledges linked to authorized clients.

### 7. Price Alerts
- **Ownership Bound**: Users can only view, insert, update, or delete their own price alerts (`auth.uid() = user_id`).
