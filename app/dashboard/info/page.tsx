"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Cpu,
    ArrowRightLeft,
    Scale,
    TrendingUp,
    ShieldCheck,
    Terminal,
    BookOpen,
    Lock,
    RefreshCw,
    Database,
    Zap,
    ChevronRight,
    X,
    UserCircle,
    Download,
    FileCheck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

const SECTIONS = [
    {
        id: 'overview',
        label: 'The Mission',
        icon: <Zap size={18} />,
        color: 'bg-yellow-500',
        content: {
            title: "Command Center for Family Wealth",
            subtitle: "Portfolio Tracker is a high-performance private engine built to solve the transparency gap in traditional retail investment apps.",
            details: [
                "Hierarchical Management: Oversee multiple 'Clients' (Spouse, Parents, Kids) from a single hub.",
                "Atomic Integrity: Every transaction is verified at the database level using PL/pgSQL triggers.",
                "Zero Drift Architecture: Financial math is handled by Postgres Views, ensuring the UI and DB are always perfectly synced."
            ]
        }
    },
    {
        id: 'fifo',
        label: 'FIFO Engine',
        icon: <ArrowRightLeft size={18} />,
        color: 'bg-blue-500',
        content: {
            title: "Surgical Lot-Level Tracking",
            subtitle: "We don't just track 'holdings'; we track every unique purchase batch to handle First-In-First-Out liquidations flawlessly.",
            details: [
                "Lot Autonomy: Every buy gets a unique UUID. When you sell, the system automatically 'eats' from the oldest lot first.",
                "Partial Splits: Selling 50 shares of a 100-share lot? The system generates a split ledger entry instantly.",
                "Chain of Custody: Every sale record contains a direct pointer to the original purchase lot for audit trails."
            ]
        }
    },
    {
        id: 'analytics',
        label: 'P/L Analytics',
        icon: <TrendingUp size={18} />,
        color: 'bg-emerald-500',
        content: {
            title: "Beyond Simple Gains",
            subtitle: "Advanced metrics to help you understand your portfolio's regulatory and performance health.",
            details: [
                "Adjusted Profit: Automated calculation using 'Grandfathered Rates' (Buy price vs. Cutoff price) for accurate historical reporting.",
                "LT/ST Classification: Real-time classification based on holding periods (Short Term vs Long Term).",
                "Asset Valuation: Live market valuation joined with Yahoo Finance price updates."
            ]
        }
    },
    {
        id: 'privacy',
        label: 'Privacy HUD',
        icon: <Lock size={18} />,
        color: 'bg-indigo-500',
        content: {
            title: "Stealth Mode Integrated",
            subtitle: "Keep your sensitive financial data hidden in shared or public environments.",
            details: [
                "Screensaver HUD: A stylized, data-masked interface that activates after a period of idle time.",
                "Manual Stealth: Click the Sidebar logo at any time to instantly mask all screens.",
                "Dismissal Preference: Choose between standard activity-wake or 'Click-Only' wake in your Profile settings."
            ]
        }
    },
    {
        id: 'verification',
        label: 'Verification',
        icon: <RefreshCw size={18} />,
        color: 'bg-purple-500',
        content: {
            title: "Trust but Verify",
            subtitle: "Reconcile your manual ledger against official NSDL/CDSL holdings exports.",
            details: [
                "CSV Reconciliation: Upload exports from your DP and let the engine identify discrepancies.",
                "Ticker Discovery: Integration with Yahoo Finance for finding ISINs and authenticating stock names.",
                "Diff View: Visual identification of quantity mismatches between your records and the depository."
            ]
        }
    }
];

export default function InfoPage() {
    const [activeTab, setActiveTab] = useState(SECTIONS[0].id);
    const [showSchema, setShowSchema] = useState(false);

    const activeData = SECTIONS.find(s => s.id === activeTab);

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
            {/* --- HERO SECTION --- */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 text-white shadow-2xl border border-white/5">
                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                            <Cpu size={14} className="animate-pulse" /> Core System v2.0
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                            Mastering the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400">
                                WealthTrack Engine
                            </span>
                        </h1>
                        <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-md">
                            Welcome to the command center. This isn't just a tracker; it's a precision instrument for multi-entity wealth management.
                        </p>

                        <div className="flex gap-4 pt-4">
                            <Button
                                onClick={() => setShowSchema(true)}
                                className="bg-white text-slate-900 hover:bg-slate-200 rounded-2xl px-6 py-6 font-bold shadow-xl shadow-white/5 transition-all group"
                            >
                                <Database size={18} className="mr-2 group-hover:rotate-12 transition-transform" />
                                Inspect Schema
                            </Button>
                            <a href="https://github.com/namanbhaia/PortfolioTracker" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" className="border-white/20 hover:bg-white hover:text-slate-900 rounded-2xl px-6 py-6 font-bold text-white transition-all">
                                    <Terminal size={18} className="mr-2" />
                                    Source
                                </Button>
                            </a>
                        </div>
                    </div>

                    <div className="hidden lg:block relative">
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/10 shadow-inner"
                        >
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`h-2 rounded-full bg-white/${i === 1 ? '20' : i === 2 ? '10' : '5'} w-${i === 1 ? 'full' : i === 2 ? '3/4' : '1/2'}`} />
                                ))}
                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="h-20 rounded-2xl bg-indigo-500/10 border border-white/5 flex flex-col items-center justify-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                            <TrendingUp size={14} className="text-emerald-400" />
                                        </div>
                                        <div className="h-1.5 w-10 bg-white/10 rounded-full" />
                                    </div>
                                    <div className="h-20 rounded-2xl bg-indigo-500/10 border border-white/5 flex flex-col items-center justify-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                                            <ArrowRightLeft size={14} className="text-blue-400" />
                                        </div>
                                        <div className="h-1.5 w-10 bg-white/10 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        {/* Visual Glow */}
                        <div className="absolute -inset-10 bg-indigo-500/20 blur-[100px] -z-10 rounded-full" />
                    </div>
                </div>
            </div>

            {/* --- INTERACTIVE NAVIGATOR --- */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-auto md:h-[600px]">
                {/* Side Nav */}
                <div className="w-full md:w-72 bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-2 shrink-0">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Interactive Guide</h3>
                    {SECTIONS.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveTab(section.id)}
                            className={`flex items-center gap-3 p-4 rounded-2xl transition-all text-left group ${activeTab === section.id
                                ? 'bg-white shadow-lg shadow-slate-200/50 text-slate-900 border border-slate-200'
                                : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-700'
                                }`}
                        >
                            <div className={`p-2 rounded-xl transition-colors ${activeTab === section.id ? section.color + ' text-white' : 'bg-slate-200 text-slate-400 group-hover:bg-slate-300'
                                }`}>
                                {section.icon}
                            </div>
                            <span className="font-bold text-sm tracking-tight">{section.label}</span>
                            {activeTab === section.id && (
                                <ChevronRight size={16} className="ml-auto text-slate-300" />
                            )}
                        </button>
                    ))}

                    <div className="mt-auto pt-6 border-t border-slate-200">
                        <div className="bg-indigo-600 rounded-2xl p-4 text-white space-y-3 shadow-lg shadow-indigo-100">
                            <ShieldCheck size={20} />
                            <p className="text-[10px] font-medium leading-relaxed opacity-80 uppercase tracking-wider">
                                System verified for security & performance.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                        >
                            <div className="space-y-4">
                                <div className={`w-14 h-14 rounded-2xl ${activeData?.color} text-white flex items-center justify-center p-3 shadow-xl`}>
                                    {activeData?.icon && React.cloneElement(activeData.icon as React.ReactElement<any>, { size: 28 })}
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{activeData?.content.title}</h2>
                                <p className="text-lg text-slate-500 leading-relaxed font-medium">{activeData?.content.subtitle}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {activeData?.content.details.map((detail, idx) => {
                                    const [title, text] = detail.split(':');
                                    return (
                                        <div key={idx} className="flex gap-4 items-start p-6 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-colors">
                                            <div className="mt-1 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                                <div className={`w-2 h-2 rounded-full ${activeTab === activeData?.id ? activeData?.color : 'bg-slate-300'}`} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-black text-sm text-slate-800 uppercase tracking-wide">{title}</h4>
                                                <p className="text-slate-500 text-sm leading-relaxed">{text}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {activeTab === 'analytics' && (
                                <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                                        <Scale className="text-amber-500" />
                                    </div>
                                    <p className="text-xs text-amber-700 leading-relaxed font-bold uppercase tracking-wide">
                                        Pro Tip: Use the 'Adjusted Profit' metric to understand your true tax-liable gains by accounting for regulatory price bands.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* --- WORKFLOW TILES --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Ledger", icon: <Download size={20} />, text: "Automated FIFO logging", color: "text-blue-500" },
                    { label: "Privacy", icon: <Lock size={20} />, text: "Click-to-Wake security", color: "text-indigo-500" },
                    { label: "Tax-Ready", icon: <FileCheck size={20} />, text: "LT/ST classification", color: "text-emerald-500" },
                    { label: "Verified", icon: <RefreshCw size={20} />, text: "CDSL/NSDL reconciliation", color: "text-purple-500" }
                ].map((tile, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-200 hover:shadow-xl transition-all group flex flex-col gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ${tile.color}`}>
                            {tile.icon}
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900 text-sm">{tile.label}</h4>
                            <p className="text-xs text-slate-500 font-medium">{tile.text}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- DEVELOPER FOOTER --- */}
            <div className="bg-slate-100 rounded-[2.5rem] p-8 mt-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-200">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center text-white text-3xl font-black">
                            NM
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-4 border-slate-100 flex items-center justify-center">
                            <Zap size={14} className="text-white" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xl font-black text-slate-900 tracking-tighter">Architected by Naman and Manvi</h4>
                        <p className="text-sm text-slate-500 font-medium max-w-sm">
                            Built with love and coffee to bridge the gap between retail trading and professional wealth management.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="px-5 py-3 rounded-2xl bg-white border border-slate-200 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Live</span>
                    </div>
                    <div className="px-5 py-3 rounded-2xl bg-white border border-slate-200 flex items-center gap-3">
                        <BookOpen size={14} className="text-indigo-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">v2.0.4-LTS</span>
                    </div>
                </div>
            </div>

            {/* --- SCHEMA MODAL --- */}
            <AnimatePresence>
                {showSchema && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="relative bg-white rounded-[3rem] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50 backdrop-blur-md">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                                        <Database size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Core Data Schema</h2>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Relational Asset Architecture</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowSchema(false)}
                                    className="w-12 h-12 flex items-center justify-center hover:bg-slate-200 rounded-full transition-all group"
                                >
                                    <X size={24} className="text-slate-400 group-hover:text-slate-900 group-hover:rotate-90 transition-all" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-12 bg-slate-100/50 flex justify-center items-start">
                                <div className="max-w-4xl w-full">
                                    <Zoom>
                                        <img
                                            src="/images/schema.png"
                                            alt="SQL Schema Diagram"
                                            className="w-full rounded-[2rem] shadow-2xl border border-white/40 ring-1 ring-slate-200 cursor-zoom-in"
                                        />
                                    </Zoom>
                                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { t: "Purchases", d: "Batched inventory (Lots)" },
                                            { t: "Sales", d: "FIFO liquidation records" },
                                            { t: "Assets", d: "Market reference data" }
                                        ].map((info, i) => (
                                            <div key={i} className="bg-white/60 p-4 rounded-2xl border border-white/60 text-center">
                                                <h5 className="font-black text-[10px] uppercase text-slate-800">{info.t}</h5>
                                                <p className="text-xs text-slate-500 italic">{info.d}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t bg-slate-50 text-center shadow-inner">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">WealthTrack Neural Core • Secured Transmission</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}