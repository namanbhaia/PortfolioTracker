"use client";

import React, { useState, useMemo } from 'react';
import { Users, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientMultiSelect } from "@/components/ui/client-filter";
import ConsolidatedHoldingsTable from "@/components/dashboard/consolidated-holdings-table";
import { RefreshButton } from "@/components/ui/refresh-button";

interface DashboardClientWrapperProps {
    initialHoldings: any[];
    initialPledges: any[];
    availableClients: any[];
    userName: string;
}

export default function DashboardClientWrapper({
    initialHoldings,
    initialPledges,
    availableClients,
    userName
}: DashboardClientWrapperProps) {
    // 1. Filter State (Local instead of URL search params)
    const [selectedClientNames, setSelectedClientNames] = useState<string[]>([]);

    // 2. Client-side Aggregation and Metrics Logic
    const { consolidatedRows, totalInvested, currentTotalValue, totalPL, plPercentage } = useMemo(() => {
        // Filter holdings and pledges by selected client names
        const filteredHoldings = selectedClientNames.length > 0
            ? initialHoldings.filter(h => selectedClientNames.includes(h.client_name))
            : initialHoldings;

        const filteredPledges = selectedClientNames.length > 0
            ? initialPledges.filter(p => selectedClientNames.includes(p.client_name))
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
                    dividend_yield: curr.dividend_yield,
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
    }, [initialHoldings, initialPledges, selectedClientNames]);

    const handleToggleFilter = (clientName: string) => {
        setSelectedClientNames(prev =>
            prev.includes(clientName)
                ? prev.filter(name => name !== clientName)
                : [...prev, clientName]
        );
    };

    return (
        <div className="p-6 space-y-8 mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Executive Summary</h1>
                    <p className="text-sm text-slate-500">
                        Consolidated overview for <span className="font-semibold text-indigo-600">{userName}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <RefreshButton />
                    <div className="w-full md:w-48">
                        <ClientMultiSelect
                            clients={availableClients}
                            selectedKeys={selectedClientNames}
                            onChange={handleToggleFilter}
                            identifier="client_name"
                        />
                    </div>
                </div>
            </header>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Invested</CardTitle>
                        <Wallet className="h-4 w-4 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Current Value</CardTitle>
                        <PieChart className="h-4 w-4 text-indigo-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-600">₹{currentTotalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Possible P/L</CardTitle>
                        <TrendingUp className={`h-4 w-4 ${totalPL >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{totalPL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                        <p className={`text-xs font-bold flex items-center mt-1 ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalPL >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {(plPercentage * 100).toFixed(2)}%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* CONSOLIDATED HOLDINGS TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Union of Family Holdings</h3>
                    <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-1 rounded-md">
                        {consolidatedRows.length} TICKERS
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <ConsolidatedHoldingsTable consolidatedRows={consolidatedRows || []} />

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
