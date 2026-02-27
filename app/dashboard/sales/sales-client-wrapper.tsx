"use client";

import React, { useState, useMemo } from 'react';
import HoldingsFilters from '@/components/ui/holdings-filters';
import SalesTable from '@/components/dashboard/sales-table';

export type SortFieldSales = 'client_name' | 'ticker' | 'stock_name' | 'sale_date' | 'pl_percent' | 'pl' | 'long_term';

export default function SalesClientWrapper({
    initialSales,
    availableClients
}: {
    initialSales: Record<string, any>[],
    availableClients: Record<string, any>[]
}) {
    // 1. Filter State Local to this component (instead of URL)
    const [ticker, setTicker] = useState("");
    const [shareName, setShareName] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showAll, setShowAll] = useState(true); // Sales don't really have "active" by default in the same way, but keeping prop
    const [longTerm, setLongTerm] = useState<boolean | null>(null);
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

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
            result = result.filter(h => new Date(h.sale_date) >= new Date(startDate));
        }

        if (endDate) {
            result = result.filter(h => new Date(h.sale_date) <= new Date(endDate));
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
            if (sortConfig.key === 'sale_date') {
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
    }, [initialSales, ticker, shareName, startDate, endDate, longTerm, selectedClientIds, sortConfig]);

    const handleSort = (key: SortFieldSales) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    return (
        <div className="space-y-4">
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
            />
        </div>
    );
}

