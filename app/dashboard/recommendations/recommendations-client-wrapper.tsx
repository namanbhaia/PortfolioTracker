"use client"

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2, Sparkles, ReceiptText, LineChart, Users, Activity, PieChart as PieIcon } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ClientMultiSelect } from '@/components/tables/client-filter';

import GeminiTab from '@/components/recommendations/gemini-tab';
import TaxLossTab from '@/components/recommendations/tax-loss-tab';
import StatsTab from '@/components/recommendations/stats-tab';
import TechnicalTab from '@/components/recommendations/technical-tab';
import GraphsTab from '@/components/recommendations/graphs-tab';

export default function RecommendationsClientWrapper({
    initialHoldings,
    availableClients,
    transactions,
    initialPledges = []
}: {
    initialHoldings: any[],
    availableClients: any[],
    transactions: any[],
    initialPledges?: any[]
}) {
    // 1. Client Selection State - default to none
    const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);

    // 2. Tab Visibility State
    const [enabledTabs, setEnabledTabs] = useState({
        ai: true,
        tax: true,
        stats: true,
        technical: true,
        graphs: true
    });

    const [activeTab, setActiveTab] = useState("ai");

    // Load preferences
    useEffect(() => {
        const saved = localStorage.getItem('recommendations-tabs-pref');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setEnabledTabs(parsed);
                // Ensure active tab is still enabled
                if (!parsed[activeTab]) {
                    if (parsed.ai) setActiveTab("ai");
                    else if (parsed.tax) setActiveTab("tax");
                    else if (parsed.stats) setActiveTab("stats");
                }
            } catch (e) {
                console.error("Failed to parse tab preferences");
            }
        }
    }, []);

    // Save preferences
    useEffect(() => {
        localStorage.setItem('recommendations-tabs-pref', JSON.stringify(enabledTabs));
    }, [enabledTabs]);

    const handleTabToggle = (tabKey: keyof typeof enabledTabs) => {
        setEnabledTabs(prev => {
            const next = { ...prev, [tabKey]: !prev[tabKey] };
            // Don't allow all tabs to be disabled
            if (!next.ai && !next.tax && !next.stats && !next.technical && !next.graphs) {
                return prev;
            }
            return next;
        });
    };

    // Filter data based on selected clients
    const filteredHoldings = React.useMemo(() =>
        initialHoldings.filter(h => selectedClientIds.includes(h.client_id)),
        [initialHoldings, selectedClientIds]);

    const filteredTransactions = React.useMemo(() =>
        transactions.filter(t => selectedClientIds.includes(t.client_id)),
        [transactions, selectedClientIds]);

    // Map selected client IDs to client names for filtering pledges
    const selectedClientNames = React.useMemo(() => {
        return availableClients
            .filter(c => selectedClientIds.includes(c.client_id))
            .map(c => c.client_name);
    }, [availableClients, selectedClientIds]);

    const filteredPledges = React.useMemo(() => {
        return initialPledges.filter(p => selectedClientNames.includes(p.client_name));
    }, [initialPledges, selectedClientNames]);

    const handleClientToggle = (clientId: string) => {
        setSelectedClientIds(prev =>
            prev.includes(clientId)
                ? prev.filter(id => id !== clientId)
                : [...prev, clientId]
        );
    };

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex-1">
                    <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">
                        Explore various strategies and insights to optimize your portfolio.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                        <div className="w-full md:w-64">
                            <ClientMultiSelect
                                clients={availableClients}
                                selectedKeys={selectedClientIds}
                                onChange={handleClientToggle}
                                identifier="client_id"
                            />
                        </div>
                        <div className="flex gap-1 shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedClientIds(availableClients.map(c => c.client_id))}
                                className="h-10 px-3 border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Select All
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedClientIds([])}
                                className="h-10 px-3 border-slate-200 dark:border-slate-800 dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Clear
                            </Button>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 h-10 border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white transition-colors">
                                <Settings2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Strategies</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl transition-colors">
                            <DropdownMenuLabel className="dark:text-slate-400">Visible Tabs</DropdownMenuLabel>
                            <DropdownMenuSeparator className="dark:bg-slate-800" />
                            <DropdownMenuCheckboxItem
                                checked={enabledTabs.ai}
                                onCheckedChange={() => handleTabToggle('ai')}
                                className="focus:bg-indigo-50 dark:focus:bg-indigo-900/20 dark:text-slate-300"
                            >
                                <Sparkles className="mr-2 h-4 w-4 text-indigo-500" />
                                AI Assistant
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={enabledTabs.tax}
                                onCheckedChange={() => handleTabToggle('tax')}
                                className="focus:bg-rose-50 dark:focus:bg-rose-900/20 dark:text-slate-300"
                            >
                                <ReceiptText className="mr-2 h-4 w-4 text-rose-500" />
                                Tax Loss Harvesting
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={enabledTabs.stats}
                                onCheckedChange={() => handleTabToggle('stats')}
                                className="focus:bg-emerald-50 dark:focus:bg-emerald-900/20 dark:text-slate-300"
                            >
                                <LineChart className="mr-2 h-4 w-4 text-emerald-500" />
                                Portfolio Health
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={enabledTabs.technical}
                                onCheckedChange={() => handleTabToggle('technical')}
                                className="focus:bg-blue-50 dark:focus:bg-blue-900/20 dark:text-slate-300"
                            >
                                <Activity className="mr-2 h-4 w-4 text-blue-500" />
                                Technical Insights
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={enabledTabs.graphs}
                                onCheckedChange={() => handleTabToggle('graphs')}
                                className="focus:bg-purple-50 dark:focus:bg-purple-900/20 dark:text-slate-300"
                            >
                                <PieIcon className="mr-2 h-4 w-4 text-purple-500" />
                                Portfolio Graphs
                            </DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex flex-row h-auto w-full lg:w-max mb-6 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 p-1 rounded-xl overflow-x-auto transition-colors">
                    {enabledTabs.ai && (
                        <TabsTrigger
                            value="ai"
                            className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:data-[state=active]:bg-indigo-500 data-[state=inactive]:hover:bg-slate-200 dark:data-[state=inactive]:hover:bg-slate-700/50 rounded-lg py-2.5 px-6 transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                <span>AI Assistant</span>
                            </div>
                        </TabsTrigger>
                    )}
                    {enabledTabs.tax && (
                        <TabsTrigger
                            value="tax"
                            className="data-[state=active]:bg-rose-600 data-[state=active]:text-white dark:data-[state=active]:bg-rose-500 data-[state=inactive]:hover:bg-slate-200 dark:data-[state=inactive]:hover:bg-slate-700/50 rounded-lg py-2.5 px-6 transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <ReceiptText className="h-4 w-4" />
                                <span>Tax Loss Harvesting</span>
                            </div>
                        </TabsTrigger>
                    )}
                    {enabledTabs.stats && (
                        <TabsTrigger
                            value="stats"
                            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white dark:data-[state=active]:bg-emerald-500 data-[state=inactive]:hover:bg-slate-200 dark:data-[state=inactive]:hover:bg-slate-700/50 rounded-lg py-2.5 px-6 transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <LineChart className="h-4 w-4" />
                                <span>Portfolio Health</span>
                            </div>
                        </TabsTrigger>
                    )}
                    {enabledTabs.technical && (
                        <TabsTrigger
                            value="technical"
                            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-500 data-[state=inactive]:hover:bg-slate-200 dark:data-[state=inactive]:hover:bg-slate-700/50 rounded-lg py-2.5 px-6 transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                <span>Technical Insights</span>
                            </div>
                        </TabsTrigger>
                    )}
                    {enabledTabs.graphs && (
                        <TabsTrigger
                            value="graphs"
                            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white dark:data-[state=active]:bg-purple-500 data-[state=inactive]:hover:bg-slate-200 dark:data-[state=inactive]:hover:bg-slate-700/50 rounded-lg py-2.5 px-6 transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <PieIcon className="h-4 w-4" />
                                <span>Graphs</span>
                            </div>
                        </TabsTrigger>
                    )}
                </TabsList>

                {enabledTabs.ai && (
                    <TabsContent value="ai" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                        <GeminiTab holdings={filteredHoldings} transactions={filteredTransactions} clients={availableClients} />
                    </TabsContent>
                )}

                {enabledTabs.tax && (
                    <TabsContent value="tax" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                        <TaxLossTab holdings={filteredHoldings} transactions={filteredTransactions} clients={availableClients} />
                    </TabsContent>
                )}

                {enabledTabs.stats && (
                    <TabsContent value="stats" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                        <StatsTab holdings={filteredHoldings} transactions={filteredTransactions} clients={availableClients} pledges={filteredPledges} />
                    </TabsContent>
                )}

                {enabledTabs.technical && (
                    <TabsContent value="technical" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                        <TechnicalTab holdings={filteredHoldings} />
                    </TabsContent>
                )}

                {enabledTabs.graphs && (
                    <TabsContent value="graphs" className="focus-visible:outline-none focus-visible:ring-0 mt-0">
                        <GraphsTab holdings={filteredHoldings} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}
