"use client"

import React, { useState, useMemo } from 'react';
import { Users } from "lucide-react";
import HoldingsFilter from "@/components/ui/holdings-filters";
import ConsolidatedHoldingsTable, { consolidated_columns } from "@/components/dashboard/consolidated-holdings-table";
import { RefreshButton } from "@/components/ui/refresh-button";
import { SyncPricesButton } from "@/components/ui/sync-prices-button";
import SummaryCards from "@/components/ui/summary-cards";
import { useColumnVisibility } from '@/hooks/use-column-visibility';
import { ColumnVisibilityToggle } from '@/components/ui/column-visibility-toggle';

/**
 * @file dashboard-client-wrapper.tsx
 * @description Client-side wrapper for the Executive Summary dashboard, handling filtering and aggregation.
 */

interface DashboardClientWrapperProps {
    initialHoldings: any[];
    initialPledges: any[];
    availableClients: any[];
    userName: string;
}

/**
 * Main dashboard client component that handles state and data aggregation.
 * @param {DashboardClientWrapperProps} props - Initial holdings, pledges, available clients, and user info.
 */
export default function DashboardClientWrapper({
    initialHoldings,
    initialPledges,
    availableClients,
    userName
}: DashboardClientWrapperProps) {
    const { isVisible, toggleColumn, visibleColumns } = useColumnVisibility(
        "consolidated_holdings",
        consolidated_columns.map(c => c.id)
    );
    // 1. Filter State
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
    const [ticker, setTicker] = useState('');
    const [shareName, setShareName] = useState('');
    const [pledgedOnly, setPledgedOnly] = useState(false);

    // 2. Client-side Aggregation and Metrics Logic
    const { consolidatedRows, totalInvested, currentTotalValue, totalPL, plPercentage } = useMemo(() => {
        // Filter holdings and pledges by selected client IDs/Names
        const filteredHoldings = selectedClientIds.length > 0
            ? initialHoldings.filter(h => selectedClientIds.includes(h.client_id))
            : initialHoldings;

        // Map client IDs to Names for pledge filtering
        const selectedNames = availableClients
            .filter(c => selectedClientIds.includes(c.client_id))
            .map(c => c.client_name);

        const filteredPledges = selectedNames.length > 0
            ? initialPledges.filter(p => selectedNames.includes(p.client_name))
            : initialPledges;

        // Aggregate by Ticker
        const aggregatedMap = (filteredHoldings || []).reduce((acc: any, curr) => {
            const key = curr.ticker;
            if (!acc[key]) {
                acc[key] = {
                    ticker: curr.ticker,
                    isin: curr.isin,
                    stock_name: curr.stock_name,
                    total_qty: 0,
                    total_purchase_value: 0,
                    market_rate: Number(curr.market_rate),
                    total_market_value: 0,
                    total_pledged: 0,
                    beta: curr.beta,
                    trailing_pe: curr.trailing_pe,
                    today_high: curr.today_high,
                    today_low: curr.today_low,
                    today_open: curr.today_open,
                    eps: curr.eps,
                };
            }

            const qty = Number(curr.balance_qty);
            const purchaseRate = Number(curr.rate || curr.purchase_rate);

            acc[key].total_qty += qty;
            acc[key].total_purchase_value += qty * purchaseRate;
            acc[key].total_market_value += qty * Number(curr.market_rate);

            return acc;
        }, {});

        // Add pledged totals
        (filteredPledges || []).forEach(pledge => {
            if (aggregatedMap[pledge.ticker]) {
                aggregatedMap[pledge.ticker].total_pledged += Number(pledge.pledged_qty);
            }
        });

        // Convert to array and calculate P/L
        const rows = Object.values(aggregatedMap)
            .map((item: any) => {
                const avg_purchase_price = item.total_qty > 0 ? item.total_purchase_value / item.total_qty : 0;
                const pl = item.total_market_value - item.total_purchase_value;
                const pl_percent = item.total_purchase_value > 0 ? (pl / item.total_purchase_value) * 100 : 0;
                return {
                    ...item,
                    avg_purchase_price,
                    pl,
                    pl_percent,
                };
            })
            // APPLY NEW FILTERS HERE
            .filter((row: any) => {
                const matchesTicker = ticker ? row.ticker.toLowerCase().includes(ticker.toLowerCase()) : true;
                const matchesStock = shareName ? row.stock_name.toLowerCase().includes(shareName.toLowerCase()) : true;
                const matchesPledged = pledgedOnly ? row.total_pledged > 0 : true;
                return matchesTicker && matchesStock && matchesPledged;
            })
            .sort((a, b) => a.ticker.localeCompare(b.ticker));

        // Global Metrics
        const invested = rows.reduce((acc, row) => acc + row.total_purchase_value, 0);
        const currentVal = rows.reduce((acc, row) => acc + row.total_market_value, 0);
        const pl = currentVal - invested;
        const plPct = invested > 0 ? pl / invested : 0;

        return {
            consolidatedRows: rows,
            totalInvested: invested,
            currentTotalValue: currentVal,
            totalPL: pl,
            plPercentage: plPct
        };
    }, [initialHoldings, initialPledges, selectedClientIds, ticker, shareName, pledgedOnly, availableClients]);

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto transition-colors">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">Executive Summary</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                        Consolidated wealth overview for <span className="font-semibold text-indigo-600 dark:text-indigo-400">{userName}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <ColumnVisibilityToggle
                        label="Consolidated Columns"
                        columns={consolidated_columns}
                        visibleColumns={visibleColumns}
                        onToggle={toggleColumn}
                    />
                    <RefreshButton />
                    <SyncPricesButton />
                </div>
            </header>

            {/* FILTER BAR */}
            <HoldingsFilter
                availableClients={availableClients}
                selectedClientIds={selectedClientIds}
                setSelectedClientIds={setSelectedClientIds}
                ticker={ticker}
                setTicker={setTicker}
                shareName={shareName}
                setShareName={setShareName}
                showPledgedToggle={true}
                pledgedOnly={pledgedOnly}
                setPledgedOnly={setPledgedOnly}
                showLongTermToggle={false}
                showBalanceToggle={false}
                showDateFilter={false}
            />

            {/* SUMMARY CARDS */}
            <SummaryCards
                totalInvested={totalInvested}
                currentTotalValue={currentTotalValue}
                totalPL={totalPL}
                plPercentage={plPercentage}
            />

            {/* CONSOLIDATED HOLDINGS TABLE */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center rounded-t-2xl">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wider">Union of Family Holdings</h3>
                    <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md">
                        {consolidatedRows.length} TICKERS
                    </span>
                </div>

                <div className="relative">
                    <ConsolidatedHoldingsTable
                        consolidatedRows={consolidatedRows || []}
                        isVisible={isVisible}
                    />

                    {consolidatedRows.length === 0 && (
                        <div className="py-20 text-center text-slate-400 italic">
                            No holdings found for the selected accounts.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
