"use client"
import React, { useMemo, useState } from 'react';
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

interface GraphsTabProps {
    holdings: any[];
}

const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;

    return (
        <g>
            <text x={cx} y={cy} dy={-10} textAnchor="middle" fill="currentColor" className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{payload.name}</text>
            <text x={cx} y={cy} dy={25} textAnchor="middle" fill={fill} className="font-black text-2xl">
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
                style={{ filter: `drop-shadow(0 0 8px ${fill}44)`, transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
            />
        </g>
    );
};

const CustomScatterTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900 text-white p-4 border-none shadow-2xl rounded-xl backdrop-blur-md bg-opacity-90">
                <p className="font-bold text-indigo-300 mb-1">{data.ticker}</p>
                <p className="text-xs text-slate-400 mb-2 border-b border-slate-700 pb-2">{data.stock_name}</p>
                <div className="space-y-1.5 text-sm">
                    {payload.map((p, i) => (
                        <div key={i} className="flex justify-between gap-4">
                            <span className="text-slate-400">{p.name}:</span>
                            <span className="font-mono text-white">
                                {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
                                {p.unit}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default function GraphsTab({ holdings }: GraphsTabProps) {
    const [activeIndex, setActiveIndex] = useState(-1); // Start with no active sector

    const activeHoldings = useMemo(() => 
        holdings.filter(h => Number(h.balance_qty) > 0), 
    [holdings]);

    const totalValue = useMemo(() => 
        activeHoldings.reduce((sum, h) => sum + Number(h.market_value || 0), 0),
    [activeHoldings]);

    // Diversification Score (HHI Base)
    const diversificationScore = useMemo(() => {
        if (totalValue === 0) return 0;
        const hhi = activeHoldings.reduce((sum, h) => {
            const weight = Number(h.market_value) / totalValue;
            return sum + (weight * weight);
        }, 0);
        // Normalize HHI (1 to 1/N) to a 0-100 score where 100 is max diversification
        return Math.round((1 - hhi) * 100);
    }, [activeHoldings, totalValue]);

    // 1. Portfolio Composition
    const compositionData = useMemo(() => {
        return activeHoldings
            .map(h => ({
                name: h.ticker,
                value: Number(h.market_value || 0),
                stock_name: h.stock_name
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8); // Focus on top 8 for clarity
    }, [activeHoldings]);

    // 2. Market Cap Distribution
    const marketCapData = useMemo(() => {
        let largeSize = 0, midSize = 0, smallSize = 0;
        const LARGE_T = 600000000000, MID_T = 150000000000;
        activeHoldings.forEach(h => {
            const cap = Number(h.market_cap || 0), val = Number(h.market_value || 0);
            if (cap >= LARGE_T) largeSize += val;
            else if (cap >= MID_T) midSize += val;
            else smallSize += val;
        });
        return [
            { name: 'Large Cap', value: largeSize },
            { name: 'Mid Cap', value: midSize },
            { name: 'Small Cap', value: smallSize }
        ].filter(d => d.value > 0);
    }, [activeHoldings]);

    // 3. Risk vs Return
    const avgBeta = useMemo(() => 
        activeHoldings.length ? activeHoldings.reduce((s, h) => s + Number(h.beta || 1), 0) / activeHoldings.length : 1, 
    [activeHoldings]);

    const riskReturnData = useMemo(() => 
        activeHoldings.map(h => ({
            ticker: h.ticker,
            stock_name: h.stock_name,
            beta: Number(h.beta || 1),
            pl_percent: Number(h.pl_percent || 0),
            size: Math.sqrt(Number(h.market_value)) / 50
        })), [activeHoldings]);

    // 4. Valuation vs Yield
    const avgPE = useMemo(() => {
        const withPE = activeHoldings.filter(h => Number(h.trailing_pe) > 0);
        return withPE.length ? withPE.reduce((s, h) => s + Number(h.trailing_pe), 0) / withPE.length : 25;
    }, [activeHoldings]);

    const valuationYieldData = useMemo(() => 
        activeHoldings.map(h => ({
            ticker: h.ticker,
            stock_name: h.stock_name,
            pe: Number(h.trailing_pe || 0),
            yield: Number(h.dividend_yield || 0),
            size: Math.sqrt(Number(h.market_value)) / 50
        })), [activeHoldings]);

    if (activeHoldings.length === 0) {
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
            {/* NEW: Top Metric Banner */}
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
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl border-l-4 border-l-emerald-500 transition-colors">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Average Beta</CardDescription>
                        <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">{avgBeta.toFixed(2)}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                        {avgBeta > 1.2 ? 'High Market Sensitivity' : 'Moderate Volatility'}
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl border-l-4 border-l-amber-500 transition-colors">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-slate-500 dark:text-slate-400 font-medium transition-colors">Avg Portfolio P/E</CardDescription>
                        <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white transition-colors">{avgPE.toFixed(1)}x</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                        Top valuation metrics for current holdings.
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Portfolio Composition with Enhanced Active Shape */}
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
                                <Pie
                                    activeIndex={activeIndex}
                                    activeShape={renderActiveShape}
                                    data={compositionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    dataKey="value"
                                    onMouseEnter={(_, index) => setActiveIndex(index)}
                                    onMouseLeave={() => setActiveIndex(-1)}
                                    stroke="none"
                                    animationBegin={0}
                                    animationDuration={800}
                                    animationEasing="ease-out"
                                >
                                    {compositionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={`url(#pieGrad-${index % COLORS.length})`} cursor="pointer" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 2. Market Cap Distribution with Gradients */}
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
                                    data={marketCapData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={130}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    stroke="white"
                                    strokeWidth={4}
                                >
                                    {marketCapData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CAP_COLORS[entry.name as keyof typeof CAP_COLORS]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* 3. Risk vs Return with Reference Line */}
                <Card className="bg-white border-slate-200 shadow-2xl overflow-hidden rounded-3xl lg:col-span-1">
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
                                <XAxis type="number" dataKey="beta" name="Beta" domain={[0.2, 'auto']} tick={{fill: 'currentColor'}} className="text-slate-500 dark:text-slate-400 transition-colors" />
                                <YAxis type="number" dataKey="pl_percent" name="Profit" unit="%" tick={{fill: 'currentColor'}} className="text-slate-500 dark:text-slate-400 transition-colors" />
                                <ZAxis type="number" dataKey="size" range={[60, 600]} />
                                <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                <ReferenceLine x={avgBeta} stroke="#6366f1" strokeDasharray="5 5" label={{ value: 'Avg Beta', position: 'top', fill: '#6366f1', fontSize: 12 }} />
                                <ReferenceLine y={0} stroke="#94a3b8" />
                                <Scatter data={riskReturnData}>
                                    {riskReturnData.map((entry, index) => (
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

                {/* 4. Valuation vs Yield with Reference Lines */}
                <Card className="bg-white border-slate-200 shadow-2xl overflow-hidden rounded-3xl lg:col-span-1">
                    <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6 transition-colors">
                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white transition-colors">
                            <ShieldAlert className="w-5 h-5 text-amber-600" />
                            Value vs. Income
                        </CardTitle>
                        <CardDescription className="dark:text-slate-400 transition-colors">Spotting the high-yield, low-PE bargains.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[450px] p-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800 transition-colors" />
                                <XAxis type="number" dataKey="pe" name="P/E" domain={[0, 'auto']} tick={{fill: 'currentColor'}} className="text-slate-500 dark:text-slate-400 transition-colors" />
                                <YAxis type="number" dataKey="yield" name="Yield" unit="%" tick={{fill: 'currentColor'}} className="text-slate-500 dark:text-slate-400 transition-colors" />
                                <ZAxis type="number" dataKey="size" range={[60, 600]} />
                                <Tooltip content={<CustomScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                <ReferenceLine x={avgPE} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Avg P/E', position: 'top', fill: '#f59e0b', fontSize: 12 }} />
                                <Scatter data={valuationYieldData} fill="#f59e0b" fillOpacity={0.6} stroke="#d97706" strokeWidth={2} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Insight Card */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-[2rem] p-10 shadow-2xl relative overflow-hidden">
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
