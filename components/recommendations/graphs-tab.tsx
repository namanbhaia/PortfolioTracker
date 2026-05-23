"use client"
import React, { useMemo, useState, memo } from 'react';
import { 
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
    ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Legend,
    TooltipProps, ReferenceLine, Sector
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart as PieIcon, ScatterChart as ScatterIcon, Info, TrendingUp, ShieldAlert, Zap, Target } from "lucide-react";

const COLORS = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#ec4899', '#06b6d4', '#475569', '#14b8a6', '#f43f5e'
];

const CAP_COLORS = {
    'Large Cap': '#10b981',
    'Mid Cap': '#6366f1',
    'Small Cap': '#f59e0b',
    'Other': '#94a3b8'
};

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value, index } = props;
    const color = COLORS[index % COLORS.length];

    return (
        <g>
            <text 
                x={cx} 
                y={cy} 
                dy={-10} 
                textAnchor="middle" 
                className="text-xs font-semibold uppercase tracking-wider fill-slate-500 dark:fill-slate-300"
            >
                {payload.name}
            </text>
            <text 
                x={cx} 
                y={cy} 
                dy={25} 
                textAnchor="middle" 
                fill={color} 
                className="font-black text-2xl"
            >
                ₹{(value / 100000).toFixed(1)}L
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 12}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                style={{ filter: `drop-shadow(0 0 8px ${color}55)` }}
            />
        </g>
    );
};

const RiskReturnTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-950/90 text-white p-4 border border-slate-800 shadow-2xl rounded-2xl backdrop-blur-md text-left">
                <p className="font-bold text-indigo-400 mb-1">{data.ticker}</p>
                <p className="text-xs text-slate-400 mb-2 border-b border-slate-800 pb-2">{data.stock_name}</p>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-6">
                        <span className="text-slate-400">Beta:</span>
                        <span className="font-mono font-medium text-white">{data.beta.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-6">
                        <span className="text-slate-400">P&L %:</span>
                        <span className={`font-mono font-semibold ${data.pl_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {data.pl_percent >= 0 ? '+' : ''}{data.pl_percent.toFixed(2)}%
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const ValuationYieldTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-950/90 text-white p-4 border border-slate-800 shadow-2xl rounded-2xl backdrop-blur-md text-left">
                <p className="font-bold text-indigo-400 mb-1">{data.ticker}</p>
                <p className="text-xs text-slate-400 mb-2 border-b border-slate-800 pb-2">{data.stock_name}</p>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-6">
                        <span className="text-slate-400">P/E Ratio:</span>
                        <span className="font-mono font-medium text-white">
                            {data.pe > 0 ? `${data.pe.toFixed(1)}x` : 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between gap-6">
                        <span className="text-slate-400">EPS:</span>
                        <span className="font-mono font-medium text-emerald-400">
                            ₹{data.eps.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const CompositionTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const value = Number(payload[0].value || 0);
        return (
            <div className="bg-slate-950/90 text-white p-4 border border-slate-800 shadow-2xl rounded-2xl backdrop-blur-md text-left">
                <p className="font-bold text-indigo-400 mb-1">{data.name}</p>
                {data.stock_name && (
                    <p className="text-xs text-slate-400 mb-2 border-b border-slate-800 pb-2">{data.stock_name}</p>
                )}
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-6">
                        <span className="text-slate-400">Value:</span>
                        <span className="font-mono font-medium text-emerald-400">₹{(value / 100000).toFixed(2)}L</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text 
            x={x} 
            y={y} 
            className="text-xs font-bold fill-slate-600 dark:fill-slate-300"
            textAnchor={x > cx ? 'start' : 'end'} 
            dominantBaseline="central"
        >
            {`${name} ${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

// 1. Composition Card (Memoized, handles local activeIndex)
interface CompositionCardProps {
    data: Array<{ name: string; value: number; stock_name: string }>;
    totalValue: number;
}

const CompositionCard = memo(({ data, totalValue }: CompositionCardProps) => {
    const [activeIndex, setActiveIndex] = useState(-1);

    const onPieEnter = (_: any, index: number) => {
        setActiveIndex(index);
    };

    const onPieLeave = () => {
        setActiveIndex(-1);
    };

    return (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden rounded-3xl group transition-colors">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6 transition-colors">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white transition-colors">
                            <PieIcon className="w-5 h-5 text-indigo-600" />
                            Composition
                        </CardTitle>
                        <CardDescription className="dark:text-slate-400 transition-colors">Focus on your core positions.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="h-[400px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <defs>
                            {COLORS.map((color, i) => (
                                <linearGradient key={`grad-${i}`} id={`pieGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor={color} stopOpacity={1}/>
                                </linearGradient>
                            ))}
                        </defs>
                        {activeIndex === -1 && (
                            <g>
                                <text 
                                    x="50%" 
                                    y="50%" 
                                    dy={-10} 
                                    textAnchor="middle" 
                                    className="text-xs font-semibold uppercase tracking-wider fill-slate-500 dark:fill-slate-300"
                                >
                                    Total Value
                                </text>
                                <text 
                                    x="50%" 
                                    y="50%" 
                                    dy={25} 
                                    textAnchor="middle" 
                                    className="font-black text-2xl fill-slate-900 dark:fill-white"
                                >
                                    ₹{(totalValue / 100000).toFixed(1)}L
                                </text>
                            </g>
                        )}
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                            onMouseLeave={onPieLeave}
                            stroke="none"
                            animationBegin={0}
                            animationDuration={400}
                            animationEasing="ease-out"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`url(#pieGrad-${index % COLORS.length})`} cursor="pointer" />
                            ))}
                        </Pie>
                        <Tooltip content={<CompositionTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
});
CompositionCard.displayName = "CompositionCard";

// 2. Size/Market Cap Card (Memoized)
interface MarketCapCardProps {
    data: Array<{ name: string; value: number }>;
}

const MarketCapCard = memo(({ data }: MarketCapCardProps) => {
    return (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden rounded-3xl transition-colors">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6 transition-colors">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white transition-colors">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Size Distribution
                </CardTitle>
                <CardDescription className="dark:text-slate-400 transition-colors">Large vs Mid vs Small Cap exposure.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            dataKey="value"
                            label={renderCustomLabel}
                            stroke="currentColor"
                            strokeWidth={2}
                            className="text-white dark:text-slate-900 transition-colors"
                            animationDuration={400}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CAP_COLORS[entry.name as keyof typeof CAP_COLORS]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`₹${(Number(value) / 100000).toFixed(2)}L`, 'Market Value']} />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
});
MarketCapCard.displayName = "MarketCapCard";

// 3. Sensitivity Map Card (Memoized)
interface SensitivityMapCardProps {
    data: Array<{
        ticker: string;
        stock_name: string;
        beta: number;
        pl_percent: number;
        size: number;
    }>;
    avgBeta: number;
}

const SensitivityMapCard = memo(({ data, avgBeta }: SensitivityMapCardProps) => {
    return (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden rounded-3xl lg:col-span-1 transition-colors">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6 transition-colors">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white transition-colors">
                    <ScatterIcon className="w-5 h-5 text-rose-600" />
                    Sensitivity Map
                </CardTitle>
                <CardDescription className="dark:text-slate-400 transition-colors">Where are you being rewarded for risk?</CardDescription>
            </CardHeader>
            <CardContent className="h-[450px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800 transition-colors" />
                        <XAxis 
                            type="number" 
                            dataKey="beta" 
                            name="Beta" 
                            domain={[0.2, 'auto']} 
                            tick={{ className: 'fill-slate-500 dark:fill-slate-400 text-[10px] font-semibold' }} 
                        />
                        <YAxis 
                            type="number" 
                            dataKey="pl_percent" 
                            name="Profit" 
                            unit="%" 
                            tick={{ className: 'fill-slate-500 dark:fill-slate-400 text-[10px] font-semibold' }} 
                        />
                        <ZAxis type="number" dataKey="size" range={[60, 600]} />
                        <Tooltip content={<RiskReturnTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        <ReferenceLine x={avgBeta} stroke="#6366f1" strokeDasharray="5 5" label={{ value: 'Avg Beta', position: 'top', fill: '#6366f1', fontSize: 12 }} />
                        <ReferenceLine y={0} stroke="#94a3b8" />
                        <Scatter data={data}>
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={entry.pl_percent >= 0 ? '#10b981' : '#ef4444'} 
                                    fillOpacity={0.7}
                                    stroke={entry.pl_percent >= 0 ? '#059669' : '#dc2626'}
                                    strokeWidth={2}
                                />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
});
SensitivityMapCard.displayName = "SensitivityMapCard";

// 4. Value vs Performance Card (Memoized)
interface ValuePerformanceCardProps {
    data: Array<{
        ticker: string;
        stock_name: string;
        pe: number;
        eps: number;
        size: number;
    }>;
    avgPE: number;
}

const ValuePerformanceCard = memo(({ data, avgPE }: ValuePerformanceCardProps) => {
    return (
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden rounded-3xl lg:col-span-1 transition-colors">
            <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6 transition-colors">
                <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white transition-colors">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    Value vs. Performance
                </CardTitle>
                <CardDescription className="dark:text-slate-400 transition-colors">Spotting the high-EPS, low-PE bargains.</CardDescription>
            </CardHeader>
            <CardContent className="h-[450px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800 transition-colors" />
                        <XAxis 
                            type="number" 
                            dataKey="pe" 
                            name="P/E" 
                            domain={[0, 'auto']} 
                            tick={{ className: 'fill-slate-500 dark:fill-slate-400 text-[10px] font-semibold' }} 
                        />
                        <YAxis 
                            type="number" 
                            dataKey="eps" 
                            name="EPS" 
                            tick={{ className: 'fill-slate-500 dark:fill-slate-400 text-[10px] font-semibold' }} 
                        />
                        <ZAxis type="number" dataKey="size" range={[60, 600]} />
                        <Tooltip content={<ValuationYieldTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        <ReferenceLine x={avgPE} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Avg P/E', position: 'top', fill: '#f59e0b', fontSize: 12 }} />
                        <Scatter data={data} fill="#f59e0b" fillOpacity={0.6} stroke="#d97706" strokeWidth={2} />
                    </ScatterChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
});
ValuePerformanceCard.displayName = "ValuePerformanceCard";

// Main Graphs Tab component
interface GraphsTabProps {
    holdings: any[];
}

export default function GraphsTab({ holdings }: GraphsTabProps) {
    const activeHoldings = useMemo(() => 
        holdings.filter(h => Number(h.balance_qty) > 0), 
    [holdings]);

    // Group active holdings by unique stock ticker
    const groupedHoldings = useMemo(() => {
        const groups = new Map<string, {
            ticker: string;
            stock_name: string;
            balance_qty: number;
            market_value: number;
            pl: number;
            cost_basis: number;
            beta: number;
            trailing_pe: number;
            eps: number;
            market_cap: number;
            pl_percent: number;
        }>();

        activeHoldings.forEach(h => {
            const ticker = h.ticker;
            const marketValue = Number(h.market_value || 0);
            const pl = Number(h.pl || 0);
            const balanceQty = Number(h.balance_qty || 0);
            const rate = Number(h.rate || 0);
            const costBasis = balanceQty * rate;

            if (!groups.has(ticker)) {
                groups.set(ticker, {
                    ticker,
                    stock_name: h.stock_name,
                    balance_qty: 0,
                    market_value: 0,
                    pl: 0,
                    cost_basis: 0,
                    beta: Number(h.beta || 1),
                    trailing_pe: Number(h.trailing_pe || 0),
                    eps: Number(h.eps || 0),
                    market_cap: Number(h.market_cap || 0),
                    pl_percent: 0
                });
            }

            const g = groups.get(ticker)!;
            g.balance_qty += balanceQty;
            g.market_value += marketValue;
            g.pl += pl;
            g.cost_basis += costBasis;
        });

        const result = Array.from(groups.values());
        result.forEach(g => {
            if (g.cost_basis > 0) {
                g.pl_percent = (g.pl / g.cost_basis) * 100;
            } else {
                g.pl_percent = 0;
            }
        });

        return result;
    }, [activeHoldings]);

    const totalValue = useMemo(() => 
        groupedHoldings.reduce((sum, h) => sum + h.market_value, 0),
    [groupedHoldings]);

    // Diversification Score (HHI Base on Unique Ticker Positions)
    const diversificationScore = useMemo(() => {
        if (totalValue === 0) return 0;
        const hhi = groupedHoldings.reduce((sum, h) => {
            const weight = h.market_value / totalValue;
            return sum + (weight * weight);
        }, 0);
        return Math.round((1 - hhi) * 100);
    }, [groupedHoldings, totalValue]);

    // 1. Portfolio Composition (Top 7 + Other combined)
    const compositionData = useMemo(() => {
        const sorted = [...groupedHoldings].sort((a, b) => b.market_value - a.market_value);
        if (sorted.length <= 8) {
            return sorted.map(h => ({
                name: h.ticker,
                value: h.market_value,
                stock_name: h.stock_name
            }));
        }
        const top = sorted.slice(0, 7);
        const otherValue = sorted.slice(7).reduce((sum, h) => sum + h.market_value, 0);
        return [
            ...top.map(h => ({
                name: h.ticker,
                value: h.market_value,
                stock_name: h.stock_name
            })),
            { name: 'Other Assets', value: otherValue, stock_name: 'Other remaining assets' }
        ];
    }, [groupedHoldings]);

    // 2. Market Cap Distribution (Grouped by threshold limits)
    const marketCapData = useMemo(() => {
        let largeSize = 0, midSize = 0, smallSize = 0;
        const LARGE_T = 600000000000, MID_T = 150000000000;
        
        groupedHoldings.forEach(h => {
            const cap = h.market_cap;
            const val = h.market_value;
            if (cap >= LARGE_T) largeSize += val;
            else if (cap >= MID_T) midSize += val;
            else smallSize += val;
        });

        return [
            { name: 'Large Cap', value: largeSize },
            { name: 'Mid Cap', value: midSize },
            { name: 'Small Cap', value: smallSize }
        ].filter(d => d.value > 0);
    }, [groupedHoldings]);

    // 3. Weighted Average Beta
    const avgBeta = useMemo(() => {
        if (totalValue === 0) return 1;
        const weightedBetaSum = groupedHoldings.reduce((sum, h) => {
            const beta = Number(h.beta || 1);
            return sum + (beta * h.market_value);
        }, 0);
        return weightedBetaSum / totalValue;
    }, [groupedHoldings, totalValue]);

    const riskReturnData = useMemo(() => 
        groupedHoldings.map(h => ({
            ticker: h.ticker,
            stock_name: h.stock_name,
            beta: Number(h.beta || 1),
            pl_percent: h.pl_percent,
            size: Math.sqrt(h.market_value) / 50
        })), [groupedHoldings]);

    // 4. Weighted Average Portfolio P/E
    const avgPE = useMemo(() => {
        const withPE = groupedHoldings.filter(h => Number(h.trailing_pe) > 0);
        const totalValWithPE = withPE.reduce((sum, h) => sum + h.market_value, 0);
        if (totalValWithPE === 0) return 25;
        const weightedPESum = withPE.reduce((sum, h) => {
            return sum + (Number(h.trailing_pe) * h.market_value);
        }, 0);
        return weightedPESum / totalValWithPE;
    }, [groupedHoldings]);

    const valuationYieldData = useMemo(() => 
        groupedHoldings.map(h => ({
            ticker: h.ticker,
            stock_name: h.stock_name,
            pe: Number(h.trailing_pe || 0),
            eps: Number(h.eps || 0),
            size: Math.sqrt(h.market_value) / 50
        })), [groupedHoldings]);

    if (groupedHoldings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-slate-50/50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-200 dark:border-slate-700 border-dashed backdrop-blur-sm transition-colors">
                <div className="p-6 bg-white dark:bg-slate-900 rounded-full shadow-lg mb-6 transition-colors">
                    <PieIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors">No Active Holdings Portfolio</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mt-3 leading-relaxed transition-colors">Add transactions to see interactive risk maps and diversification metrics.</p>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-10">
            {/* Top Metric Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-indigo-600 text-white border-none shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Zap size={80} />
                    </div>
                    <CardHeader className="pb-2">
                        <CardDescription className="text-indigo-100 font-medium">Diversification Score</CardDescription>
                        <CardTitle className="text-4xl font-black">{diversificationScore}/100</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-1.5 w-full bg-white/20 rounded-full mt-2">
                            <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${diversificationScore}%` }}></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl border-l-4 border-l-emerald-500 transition-colors text-left">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Average Beta</CardDescription>
                        <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">{avgBeta.toFixed(2)}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                        {avgBeta > 1.2 ? 'High Market Sensitivity' : 'Moderate Volatility'}
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl border-l-4 border-l-amber-500 transition-colors text-left">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Avg Portfolio P/E</CardDescription>
                        <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">{avgPE.toFixed(1)}x</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                        Weighted valuation metrics for current holdings.
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Portfolio Composition with Enhanced Active Shape */}
                <CompositionCard data={compositionData} totalValue={totalValue} />

                {/* 2. Size/Market Cap Distribution */}
                <MarketCapCard data={marketCapData} />

                {/* 3. Risk vs Return with Reference Line */}
                <SensitivityMapCard data={riskReturnData} avgBeta={avgBeta} />

                {/* 4. Valuation vs Yield with Reference Lines */}
                <ValuePerformanceCard data={valuationYieldData} avgPE={avgPE} />
            </div>

            {/* Bottom Insight Card */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-[2rem] p-10 shadow-2xl relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="flex-shrink-0 bg-white/10 p-5 rounded-2xl backdrop-blur-xl border border-white/20">
                        <Target className="w-10 h-10 text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black mb-3">Institutional Diversification Target</h4>
                        <p className="text-indigo-200/80 leading-relaxed max-w-2xl text-lg">
                            An ideal portfolio should have a Diversification Score above 80. Your Sensitivity Map shows that {riskReturnData.filter(d => d.beta > avgBeta).length} assets are currently more sensitive than the portfolio average. 
                            Consider balancing <span className="text-indigo-400 font-bold italic">High Beta Profit Takers</span> with <span className="text-emerald-400 font-bold italic">Low Beta Defensive Moats</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
