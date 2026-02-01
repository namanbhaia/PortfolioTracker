"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import {
    BookOpen,
    Scale,
    ShieldCheck,
    Cpu,
    Database,
    Terminal,
    UserCircle,
    ArrowRightLeft,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

export default function InfoPage() {
    const [showSchema, setShowSchema] = useState(false);
    const systemCapabilities = [
        {
            title: "Batch-Level Tracking",
            icon: <ArrowRightLeft className="text-blue-500" size={20} />,
            content: "Unlike standard apps, we track every buy as a unique 'Lot'. This allows you to select exactly which purchase lot you are selling from for precise P&L."
        },
        {
            title: "Tax Optimization",
            icon: <Scale className="text-amber-500" size={20} />,
            content: "Built-in logic for the 2024-26 Indian Budget: 12.5% for Long Term (>365 days) and 20% for Short Term capital gains."
        },
        {
            title: "Consolidated Family View",
            icon: <TrendingUp className="text-emerald-500" size={20} />,
            content: "Aggregates exposure across multiple family 'Clients' (e.g., Spouse, Parents) to show your total family stake in any single asset."
        }
    ];

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-12 animate-in fade-in duration-700">
            {/* --- HERO SECTION --- */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-10 text-white shadow-2xl">
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-6">
                        <Cpu size={14} /> System Documentation v2.0
                    </div>
                    <h1 className="text-4xl font-black tracking-tight mb-4">
                        Mastering Your <span className="text-indigo-400">WealthTrack</span> Manager
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        A high-performance private engine designed to manage complex family portfolios with surgical precision and real-time tax intelligence.
                    </p>
                </div>
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
            </div>

            {/* --- CORE CAPABILITIES --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {systemCapabilities.map((item, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-xl mb-6">
                            {item.icon}
                        </div>
                        <h3 className="font-bold text-slate-800 mb-3 text-lg">{item.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            {item.content}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* --- OPERATION GUIDE --- */}
                <div className="lg:col-span-2 space-y-8">
                    <section>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                            <Terminal className="text-indigo-600" size={24} />
                            Operational Workflow
                        </h2>
                        <div className="space-y-4">
                            {[
                                { step: "01", task: "Log a Purchase", desc: "Use the 'New Transaction' tab. Every buy is logged as a specific lot tied to a Client Account." },
                                { step: "02", task: "Track Holdings", desc: "The 'Active Holdings' view joins purchases with real-time market data to show unrealized profit." },
                                { step: "03", task: "Execute a Sale", desc: "Select a specific batch to sell. The system validates that you aren't selling more than you own." },
                                { step: "04", task: "Review Tax History", desc: "The 'Sales History' table pairs every sale with its purchase lot to calculate exact tax liability." }
                            ].map((op, i) => (
                                <div key={i} className="flex gap-6 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                                    <span className="text-3xl font-black text-slate-200">{op.step}</span>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{op.task}</h4>
                                        <p className="text-sm text-slate-500">{op.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* --- DEVELOPER & SYSTEM INFO --- */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
                            <UserCircle size={20} className="text-indigo-600" /> Developer Profile
                        </h3>
                        <div className="space-y-4">
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Developed by <span className="font-bold text-slate-800">Naman</span>, this platform was built to solve the lack of FIFO-based (First-In-First-Out) tax tracking in traditional retail investment apps.
                            </p>
                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400 uppercase">Tech Stack</span>
                                <div className="flex gap-2">
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">Next.js 15</span>
                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">Supabase</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                        <h3 className="text-indigo-900 font-bold text-sm mb-4 flex items-center gap-2">
                            <ShieldCheck size={18} /> Data Integrity
                        </h3>
                        <p className="text-xs text-indigo-700 leading-relaxed mb-4">
                            All calculations (LTCG/STCG) are performed at the database level using PostgreSQL Views to ensure zero mathematical drift between the UI and the ledger.
                        </p>
                        <Button
                            onClick={() => setShowSchema(true)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-6 font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                        >
                            <BookOpen className="mr-2" size={14} /> View SQL Schema
                        </Button>
                    </div>
                </div>
            </div>
            {/* --- SCHEMA MODAL --- */}
            {showSchema && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Database ER Diagram</h2>
                                <p className="text-xs text-slate-500">Supabase Schema showing Relationships & Foreign Keys</p>
                            </div>
                            <button
                                onClick={() => setShowSchema(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-8 bg-slate-100 flex justify-center items-start">
                            <div className="max-w-4xl w-full">
                                <Zoom>
                                    <img
                                        src="/images/schema.png"
                                        alt="SQL Schema Diagram"
                                        className="w-full rounded-xl shadow-lg border border-slate-200 cursor-zoom-in"
                                    />
                                </Zoom>
                                <p className="text-center text-[10px] text-slate-400 mt-4 font-medium uppercase tracking-widest">
                                    Click the image to expand & zoom
                                </p>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-slate-50 text-center">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">WealthTrack Private Schema • {new Date().getFullYear()}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}