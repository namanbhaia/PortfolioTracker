# Portfolio Tracker

A premium, high-performance financial dashboard for managing multiple family portfolios with advanced performance metrics and privacy features.

## 🚀 Overview

Portfolio Tracker (WealthTrack Manager) is designed for individual wealth managers and family offices to oversee multiple accounts (Clients) under a single, secure interface. It provides lot-level tracking, real-time market data integration, and advanced profit/loss analytics.

---

## 📂 Documentation

Detailed documentation is available in the [docs/](file:///c:/Users/naman/source/repos/namanbhaia/PortfolioTracker/docs/index.md) folder:

- [**Quick Start & Setup**](file:///c:/Users/naman/source/repos/namanbhaia/PortfolioTracker/docs/setup.md): Environment variables, database initialization, and deployment.
- [**Core Features**](file:///c:/Users/naman/source/repos/namanbhaia/PortfolioTracker/docs/features.md): FIFO logic, P/L metrics (Adjusted, LT/ST), Pledging, and CSV Verification.
- [**System Architecture**](file:///c:/Users/naman/source/repos/namanbhaia/PortfolioTracker/docs/architecture.md): Code structure, data flow, and authentication.
- [**Database Schema**](file:///c:/Users/naman/source/repos/namanbhaia/PortfolioTracker/docs/database.md): Table relationships, calculated views, and RLS policies.

---

## ✨ Key Features

-   **Multi-Client Management**: Switch between independent family member accounts seamlessly.
-   **Lot-Level Precision**: Every purchase is tracked as a unique batch for accurate FIFO (First-In-First-Out) execution.
-   **Advanced P/L Metrics**:
    - **Long-Term & Short-Term P/L**: Automated classification based on holding periods.
    - **Adjusted Profit**: Gains calculated using grandfathered market prices for historical accuracy.
-   **Privacy Mode**:
    - **Screensaver HUD**: Dynamic idle-time screensaver to hide sensitive financial data.
    - **Flexible Dismissal**: Configure "Click-to-Dismiss" vs "Any-Activity-Dismiss" in user settings.
-   **Market Data**: Real-time price updates via Yahoo Finance integration.
-   **CSV Reconciliation**: Verify local ledger accuracy against NSDL holdings exports.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/)
- **Database/Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Market Data**: Yahoo Finance API

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
