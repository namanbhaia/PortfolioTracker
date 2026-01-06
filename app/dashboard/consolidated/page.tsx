"use client"

import React, { useState, useMemo } from 'react';
import ConsolidatedTable from '@/components/dashboard/consolidated-table';
import ClientMultiSelect from '@/components/dashboard/client-multi-select';

export default function ConsolidatedPage({ allHoldings, clients }) {
    // 1. State for selected client names
    const [selectedClients, setSelectedClients] = useState(clients.map(c => c.client_name));

    // 2. Logic: Aggregate holdings based on selection
    const aggregatedData = useMemo(() => {
        const filtered = allHoldings.filter(h => selectedClients.includes(h.client_name));

        const totals = filtered.reduce((acc, curr) => {
            const key = curr.ticker; // Grouping by Ticker
            if (!acc[key]) {
                acc[key] = {
                    ticker: curr.ticker,
                    stock_name: curr.stock_name,
                    total_qty: 0,
                    total_market_value: 0,
                    avg_rate: 0,
                    total_cost: 0,
                    held_by: []
                };
            }

            acc[key].total_qty += curr.balance_qty;
            acc[key].total_market_value += (curr.balance_qty * curr.market_rate);
            acc[key].total_cost += (curr.balance_qty * curr.purchase_rate);

            if (!acc[key].held_by.includes(curr.client_name)) {
                acc[key].held_by.push(curr.client_name);
            }

            return acc;
        }, {});

        return Object.values(totals).map((item: any) => ({
            ...item,
            avg_rate: item.total_cost / item.total_qty,
            unrealized_pnl: item.total_market_value - item.total_cost
        }));
    }, [selectedClients, allHoldings]);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Consolidated View</h1>
                    <p className="text-slate-500">Aggregated exposure across selected family members.</p>
                </div>

                {/* Client Multi-Select Dropdown */}
                <ClientMultiSelect
                    clients={clients}
                    selected={selectedClients}
                    onChange={setSelectedClients}
                />
            </header>

            <ConsolidatedTable data={aggregatedData} />
        </div>
    );
}