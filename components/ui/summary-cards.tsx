"use client";

import React from "react";
import { TrendingUp, Wallet, PieChart, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * @file summary-cards.tsx
 * @description Modular summary metrics for the dashboard.
 */

interface SummaryMetricsProps {
    totalInvested: number;
    currentTotalValue: number;
    totalPL: number;
    plPercentage: number;
}

/**
 * Displays key portfolio summary metrics in a grid of cards.
 * @param {SummaryMetricsProps} props - The metric values to display.
 */
export default function SummaryCards({
    totalInvested,
    currentTotalValue,
    totalPL,
    plPercentage
}: SummaryMetricsProps) {
    return (
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
    );
}