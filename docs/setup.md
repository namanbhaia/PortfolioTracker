# Setup & Installation

This guide provides step-by-step instructions to set up the Portfolio Tracker project locally and in a production-like Supabase environment.

## 🛠 Prerequisites

- **Node.js**: v22.0+ 
- **npm**: v11.7+
- **Supabase Account**: For database and authentication services.

## ⚙️ Local Development Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/namanbhaia/PortfolioTracker.git
   cd PortfolioTracker
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   # Required for market data fetching
   MARKET_DATA_API_KEY=your_market_data_key 
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   The app will be accessible at `http://localhost:3000`.

## 🗄 Database Configuration

1. **Initialize Tables**:
   Copy the contents of the [CreateTables](file:///c:/Users/naman/source/repos/namanbhaia/PortfolioTracker/CreateTables) file and run them in your Supabase SQL Editor. This will set up:
   - All core tables (`profiles`, `clients`, `assets`, `purchases`, `sales`, `pledges`).
   - Calculated Views (`client_holdings`, `sales_view`).
   - Necessary stored procedures and triggers (e.g., `handle_new_user`).

2. **Supabase Auth Configuration**:
   - Enable **Email/Password** authentication in the Supabase Dashboard.
   - Configure Redirect URLs to include `http://localhost:3000/auth/callback`.

3. **Deploy Edge Functions** (Optional for automated updates):
   To enable market data sync via Supabase Edge Functions:
   ```bash
   supabase functions deploy update-prices
   ```

## 🔐 Security (RLS)

Ensure that **Row Level Security (RLS)** is enabled for sensitive tables. Policies should be scoped to `current_setting('request.jwt.claims')::json->>'sub'` (Supabase Auth ID) to ensure users can only see their own family accounts and data.
