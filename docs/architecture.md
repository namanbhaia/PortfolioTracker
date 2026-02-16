# System Architecture

Portfolio Tracker is built with a focus on high-performance financial data handling and a modern, responsive user experience. 

## 🏗 Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Programming Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (SSR supported)
- **Styling**: Tailwind CSS 4.0
- **State Management**: React Context API (for global user/navigation state)
- **Icons**: Lucide React
- **Market Data**: Yahoo Finance API integration

## 📂 Project Structure

```bash
/app
  /(auth)               # Authentication flows (Login, Signup, Password Reset)
  /dashboard            # Main authenticated application area
    /holdings           # Portfolio overview and lot-level tracking
    /sales              # Realized P&L history
    /consolidated       # Aggregated view across all clients
    /tax                # Tax-related summaries and date filtering
    /profile            # User settings and privacy preferences
/components
  /dashboard            # High-level UI (Sidebar, Screensaver, Tables)
  /forms                # Transaction entry (Buy/Sell/Pledge forms)
  /ui                   # Generic, reusable building blocks (Inputs, Buttons)
/lib
  /actions              # Server Actions for database mutations
  /supabase             # Supabase client configurations (Client/Server/Admin)
  /utils.ts             # Shared helper functions
/supabase
  /functions            # Edge Functions for background tasks (e.g. Price updates)
```

## 🔄 Data & Control Flow

1. **User Interaction**: Users interact with client-side components (Forms, Tables).
2. **Server Actions**: Mutations (e.g., adding a purchase) are handled by **Next.js Server Actions** in `lib/actions/`.
3. **Database Logic**: Heavy financial calculations are offloaded to **PostgreSQL Views** (`client_holdings`, `sales_view`) for maximum performance.
4. **Revalidation**: After a successful mutation, `revalidatePath` is called to ensure the UI reflects the latest database state immediately.
5. **Market Updates**: A Supabase Edge Function fetches the latest prices from Yahoo Finance and updates the `assets` table, which automatically recalculates all views.

## 🛡 Authentication Flow

- The application uses `middleware.ts` to protect `/dashboard` routes.
- An atomic trigger (`handle_new_user`) in the database initializes a user profile and a default primary client account upon signup, ensuring data integrity from the start.
