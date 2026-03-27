"use client";

import React, { useState, useMemo } from 'react';
import HoldingsFilters from '@/components/ui/holdings-filters';
import SalesTable, { sales_columns } from '@/components/dashboard/sales-table';
import { useColumnVisibility } from '@/hooks/use-column-visibility';
import { ColumnVisibilityToggle } from '@/components/ui/column-visibility-toggle';
import { RefreshButton } from '@/components/ui/refresh-button';

export type SortFieldSales = 'client_name' | 'ticker' | 'stock_name' | 'sale_date' | 'pl_percentage' | 'pl' | 'long_term';

export default function SalesClientWrapper({
    initialSales,
    availableClients,
    initialFilters
}: {
    initialSales: Record<string, any>[],
    availableClients: Record<string, any>[],
    initialFilters?: {
        ticker?: string;
        startDate?: string;
        endDate?: string;
        clientIds?: string[];
    }
}) {
    const { isVisible, toggleColumn, visibleColumns } = useColumnVisibility(
        "sales",
        sales_columns.map(c => c.id)
    );
    // 1. Filter State Local to this component (initialized from initialFilters if present)
    const [ticker, setTicker] = useState(initialFilters?.ticker || "");
    const [shareName, setShareName] = useState("");
    const [startDate, setStartDate] = useState(initialFilters?.startDate || "");
    const [endDate, setEndDate] = useState(initialFilters?.endDate || "");
    const [showAll, setShowAll] = useState(true);
    const [longTerm, setLongTerm] = useState<boolean | null | 'square_off'>(null);
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>(initialFilters?.clientIds || []);

    const [sortConfig, setSortConfig] = useState<{ key: SortFieldSales, direction: 'asc' | 'desc' }>({
        key: 'sale_date',
        direction: 'desc'
    });

    // 2. Client-side Filtering and Sorting logic via useMemo
    const processedSales = useMemo(() => {
        let result = [...initialSales];

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
            // Robust string comparison for YYYY-MM-DD
            result = result.filter(h => h.sale_date >= startDate);
        }

        if (endDate) {
            result = result.filter(h => h.sale_date <= endDate);
        }

        if (longTerm !== null) {
            if (longTerm === 'square_off') {
                result = result.filter(h => h.is_square_off === true);
            } else {
                // If filtering by Long Term (true) or Short Term (false)
                // We typically exclude square-off from regular LT/ST if user wants to be specific,
                // BUT in this schema long_term=true excludes square_off=true by definition of time.
                // However, ST (false) includes square_off=true.
                // If user clicks "Short Term", they might want ONLY non-square-off ST?
                // For tax purposes, ST and Square Off are different.
                result = result.filter(h => h.long_term === longTerm && (longTerm === true || h.is_square_off !== true));
            }
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
            if (sortConfig.key === 'sale_date') {
                const dateA = aVal || "";
                const dateB = bVal || "";
                return sortConfig.direction === 'asc'
                    ? dateA.localeCompare(dateB)
                    : dateB.localeCompare(dateA);
            }

            // Boolean comparison (for long_term)
            if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
                return sortConfig.direction === 'asc' ? (aVal === bVal ? 0 : aVal ? -1 : 1) : (aVal === bVal ? 0 : aVal ? 1 : -1);
            }

            return 0;
        });

        return result;
    }, [initialSales, ticker, shareName, startDate, endDate, longTerm, selectedClientIds, sortConfig]);

    const handleSort = (key: SortFieldSales) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    return (
        <div className="space-y-4">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Portfolio Sales (P/L)</h1>
                <div className="flex items-center gap-3">
                    <ColumnVisibilityToggle
                        columns={sales_columns}
                        visibleColumns={visibleColumns}
                        onToggle={toggleColumn}
                    />
                    <RefreshButton />
                </div>
            </header>

            <HoldingsFilters
                availableClients={availableClients}
                showLongTermToggle={true}
                showBalanceToggle={false}

                // Pass down specific values to the filter component
                ticker={ticker} setTicker={setTicker}
                shareName={shareName} setShareName={setShareName}
                startDate={startDate} setStartDate={setStartDate}
                endDate={endDate} setEndDate={setEndDate}
                showAll={showAll} setShowAll={setShowAll}
                longTerm={longTerm} setLongTerm={setLongTerm}
                selectedClientIds={selectedClientIds} setSelectedClientIds={setSelectedClientIds}
            />

            <SalesTable
                sales={processedSales}
                sortConfig={sortConfig}
                onSort={handleSort}
                isVisible={isVisible}
            />
        </div>
    );
}

