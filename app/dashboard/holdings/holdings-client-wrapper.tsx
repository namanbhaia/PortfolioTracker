"use client";

import React, { useState, useMemo } from 'react';
import HoldingsFilters from '@/components/ui/holdings-filters';
import HoldingsTable, { holdings_columns } from '@/components/dashboard/holdings-table';
import { useColumnVisibility } from '@/hooks/use-column-visibility';
import { ColumnVisibilityToggle } from '@/components/ui/column-visibility-toggle';
import { RefreshButton } from '@/components/ui/refresh-button';
import { SyncPricesButton } from '@/components/ui/sync-prices-button';

export type SortFieldHoldings = 'client_name' | 'ticker' | 'stock_name' | 'date' | 'pl_percent' | 'pl' | 'long_term';

export default function HoldingsClientWrapper({
    initialHoldings,
    availableClients
}: {
    initialHoldings: Record<string, any>[],
    availableClients: Record<string, any>[]
}) {
    const { isVisible, toggleColumn, visibleColumns } = useColumnVisibility(
        "holdings",
        holdings_columns.map(c => c.id)
    );
    // 1. Filter State Local to this component (instead of URL)
    const [ticker, setTicker] = useState("");
    const [shareName, setShareName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showAll, setShowAll] = useState(false); // Default: Active only
    const [longTerm, setLongTerm] = useState<boolean | null>(null);
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

    const [sortConfig, setSortConfig] = useState<{ key: SortFieldHoldings, direction: 'asc' | 'desc' }>({
        key: 'date',
        direction: 'desc'
    });

    // 2. Client-side Filtering and Sorting logic via useMemo
    const processedHoldings = useMemo(() => {
        let result = [...initialHoldings];

        // Apply filters
        if (selectedClientIds.length > 0) {
            result = result.filter(h => selectedClientIds.includes(h.client_id));
        }

        if (ticker) {
            result = result.filter(h => h.ticker?.toLowerCase().includes(ticker.toLowerCase()));
        }

        if (shareName) {
            result = result.filter(h => h.stock_name?.toLowerCase().includes(shareName.toLowerCase()));
        }

        if (startDate) {
            result = result.filter(h => new Date(h.date) >= new Date(startDate));
        }

        if (endDate) {
            result = result.filter(h => new Date(h.date) <= new Date(endDate));
        }

        if (!showAll) {
            result = result.filter(h => Number(h.balance_qty) > 0);
        }

        if (longTerm !== null) {
            result = result.filter(h => h.long_term === longTerm);
        }

        // Apply sort
        result.sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            // String comparison
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                return sortConfig.direction === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            // Numeric comparison
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }

            // Date comparison (fallback if dates are strings but need Date logic)
            if (sortConfig.key === 'date') {
                const dateA = new Date(aVal).getTime() || 0;
                const dateB = new Date(bVal).getTime() || 0;
                return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
            }

            // Boolean comparison (for long_term)
            if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
                return sortConfig.direction === 'asc' ? (aVal === bVal ? 0 : aVal ? -1 : 1) : (aVal === bVal ? 0 : aVal ? 1 : -1);
            }

            return 0;
        });

        return result;
    }, [initialHoldings, ticker, shareName, startDate, endDate, showAll, longTerm, selectedClientIds, sortConfig]);

    const handleSort = (key: SortFieldHoldings) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto transition-colors">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">Portfolio Holdings</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                        Detailed breakdown of individual purchase lots and current valuations.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ColumnVisibilityToggle
                        columns={holdings_columns}
                        visibleColumns={visibleColumns}
                        onToggle={toggleColumn}
                    />
                    <RefreshButton />
                    <SyncPricesButton />
                </div>
            </header>

            <HoldingsFilters
                availableClients={availableClients}
                showLongTermToggle={true}
                showBalanceToggle={true}

                // Pass down specific values to the filter component
                ticker={ticker} setTicker={setTicker}
                shareName={shareName} setShareName={setShareName}
                startDate={startDate} setStartDate={setStartDate}
                endDate={endDate} setEndDate={setEndDate}
                showAll={showAll} setShowAll={setShowAll}
                longTerm={longTerm} setLongTerm={setLongTerm as any}
                selectedClientIds={selectedClientIds} setSelectedClientIds={setSelectedClientIds}
            />

            <HoldingsTable
                holdings={processedHoldings}
                sortConfig={sortConfig}
                onSort={handleSort}
                isVisible={isVisible}
            />
        </div>
    );
}

