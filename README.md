# Portfolio Tracker

A premium, high-performance financial dashboard for managing multiple family portfolios with advanced performance metrics and privacy features.

## 🚀 Overview

Portfolio Tracker (WealthTrack Manager) is designed for individual wealth managers and family offices to oversee multiple accounts (Clients) under a single, secure interface. It provides lot-level tracking, real-time market data integration, and advanced profit/loss analytics.

---

## 📂 Documentation

Detailed documentation is available in the [docs/](./docs/index.md) folder:

- [**Quick Start & Setup**](./docs/setup.md): Environment variables, database initialization, and deployment.
- [**Core Features**](./docs/features.md): Temporal First-In-First-Out (FIFO) cost basis allocation logic, P/L metrics (Adjusted, LT/ST), Pledging, and CSV Verification.
- [**System Architecture**](./docs/architecture.md): Code structure, data flow, and authentication.
- [**Database Schema**](./docs/database.md): Table relationships, calculated views, and Row Level Security (RLS) policies.
- [**Google Sheets Sync**](./docs/google-sheets.md): How to configure Sheets API and environment variables.

---

## ✨ Key Features

-   **Multi-Client Management**: Switch between independent family member accounts seamlessly.
-   **Lot-Level Precision**: Every purchase is tracked as a unique batch for accurate Temporal First-In-First-Out (FIFO) cost basis allocation  execution.
-   **Advanced P/L Metrics**:
    - **Long-Term & Short-Term P/L**: Automated classification based on holding periods.
    - **Adjusted Profit**: Gains calculated using Section 112A Baseline FMV Grandfathered Rates for historical accuracy.
-   **Privacy Mode**:
    - **Screensaver HUD**: Dynamic idle-time screensaver to hide sensitive financial data.
    - **Flexible Dismissal**: Configure "Click-to-Dismiss" vs "Any-Activity-Dismiss" in user settings.
-   **Market Data**: Real-time price updates via Yahoo Finance integration.
-   **Stock Price Alerts**:
    - **Real-Time Notifications**: Instant Alerts Bell notifications when target prices are triggered.
    - **Sync-on-Refresh**: Robust event-driven architecture ensuring consistent alert states across the application.
-   **CSV Reconciliation**: Verify local ledger accuracy against NSDL holdings exports.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/)
- **Database/Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Market Data**: Yahoo Finance API

---

## 📁 Directory Structure

The project is structured by domain and purpose to ensure scalability and maintainability:

- **`components/ui/`**: Generic, reusable UI primitives (e.g., buttons, cards, tabs).
- **`components/tables/`**: Domain-specific components related to data tables, filtering, and cell rendering.
- **`components/forms/`**: Complex forms and data-entry sheets (e.g., transaction editing).
- **`components/dashboard/`**: High-level dashboard layouts, metrics, and visualization wrappers.
- **`components/shared/`**: Widgets and utilities shared across multiple domains (e.g., theme toggles, sync buttons).
- **`lib/actions/`**: Server actions categorized by feature domain (`admin`, `assets`, `export`, `profile`, `transactions`).

---

## 🏁 Quick Start

1. **Clone & Install**:
   ```bash
   git clone https://github.com/namanbhaia/PortfolioTracker.git
   cd PortfolioTracker
   npm install
   ```
2. **Setup Supabase**: Execute `CreateTables` in your Supabase SQL editor.
3. **Configure Environment**: Copy `.env.example` to `.env.local` and add your keys.
4. **Run**:
   ```bash
   npm run dev
   ```

---

## 🌐 GitHub Pages Documentation

To host this documentation on GitHub Pages:
1. Go to **Settings** > **Pages** in your repository.
2. Select **Deploy from a branch**.
3. Choose the branch (e.g., `main`) and the folder as **`/docs`**.
4. Click **Save**.

---

© 2026 Portfolio Tracker Team.
