# Portfolio Tracker Documentation Index

Welcome to the official documentation for the Portfolio Tracker project. This documentation provides a deep dive into the system's architecture, features, and setup procedures.

## 📖 Sub-Pages

### 1. [Setup & Installation](./setup.md)
Learn how to get the project running locally, configure environment variables, and set up your Supabase instance.

### 2. [System Architecture](./architecture.md)
An overview of the project structure, data flow, and the reasoning behind our tech stack choices.

### 3. [Core Features](./features.md)
Detailed explanations of:
- Temporal First-In-First-Out (FIFO) cost basis allocation Investment Ledger
- Profit/Loss metrics (Adjusted P/L, LT/ST)
- Pledging & Unpledging workflow
- CSV Verification engine (NSDL exports)
- Yahoo Finance integration

### 4. [Database Schema](./database.md)
A reference for all core tables, relationships, and the powerful PostgreSQL views that drive our financial calculations.

---

## 🛠 Project Purpose

Portfolio Tracker is built to empower wealth managers with:
- **Clarity**: Consolidated views across multiple family members.
- **Accuracy**: Precise tracking of historical buy lots and cost bases.
- **Privacy**: Innovative UI features like the screensaver HUD to protect sensitive data in shared environments.
- **Efficiency**: Automated market data fetching and reconciliation.
