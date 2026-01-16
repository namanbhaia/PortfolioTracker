"use client";

import React from 'react';
import {
    Info,
    BookOpen,
    Scale,
    RefreshCcw,
    ShieldCheck,
    ExternalLink,
    HelpCircle
} from 'lucide-react';

export default function InfoPage() {
    const sections = [
        {
            title: "How it Works",
            icon: <BookOpen className="text-blue-500" size={20} />,
            content: "This dashboard aggregates transactions from multiple family members into a single view. Market rates are updated every 24 hours via API.",
            link: "#"
        },
        {
            title: "Taxation Rules",
            icon: <Scale className="text-amber-500" size={20} />,
            content: "Holdings held for >1 year are classified as Long Term (LTCG). Less than 1 year are Short Term (STCG). This affects your tax liability upon sale.",
            link: "https://www.incometax.gov.in"
        },
        {
            title: "Data Security",
            icon: <ShieldCheck className="text-green-500" size={20} />,
            content: "Your data is protected by Row Level Security (RLS). Only authorized family admins can view or edit specific client portfolios.",
            link: "#"
        }
    ];

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 border-b pb-6">
                <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                    <Info size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Information Center</h1>
                    <p className="text-slate-500 text-sm">Guidelines, tax rules, and platform documentation.</p>
                </div>
            </div>

            {/* Quick Stats / Legend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sections.map((item, idx) => (
                    <div key={idx} className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
                                {item.icon}
                            </div>
                            <ExternalLink size={14} className="text-slate-300 group-hover:text-indigo-400" />
                        </div>
                        <h3 className="font-bold text-slate-800 mb-2">{item.title}</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            {item.content}
                        </p>
                    </div>
                ))}
            </div>

            {/* Detailed Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <div className="p-4 bg-slate-50 border-b font-bold text-xs uppercase tracking-widest text-slate-500 flex items-center gap-2">
                            <HelpCircle size={14} /> Frequently Asked Questions
                        </div>
                        <div className="divide-y divide-slate-100">
                            <div className="p-5">
                                <h4 className="font-semibold text-slate-800 mb-1">When do market prices update?</h4>
                                <p className="text-sm text-slate-500">Prices sync with the exchange once daily at 6:00 PM IST. Weekend prices reflect Friday's closing.</p>
                            </div>
                            <div className="p-5">
                                <h4 className="font-semibold text-slate-800 mb-1">How is 'Balance Qty' calculated?</h4>
                                <p className="text-sm text-slate-500">It is the original purchase quantity minus any quantities logged in the 'Sales' module for that specific lot.</p>
                            </div>
                            <div className="p-5">
                                <h4 className="font-semibold text-slate-800 mb-1">Can I link more family members?</h4>
                                <p className="text-sm text-slate-500">Contact the system administrator to generate a new Client ID and add it to your profile's authorized array.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info - System Status */}
                <div className="space-y-6">
                    <div className="bg-indigo-900 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200">
                        <h3 className="flex items-center gap-2 font-bold mb-4">
                            <RefreshCcw size={18} className="animate-spin-slow" /> System Status
                        </h3>
                        <div className="space-y-4 text-xs">
                            <div className="flex justify-between border-b border-indigo-800 pb-2">
                                <span className="text-indigo-300">Database</span>
                                <span className="font-mono text-green-400">OPERATIONAL</span>
                            </div>
                            <div className="flex justify-between border-b border-indigo-800 pb-2">
                                <span className="text-indigo-300">Market API</span>
                                <span className="font-mono text-green-400">CONNECTED</span>
                            </div>
                            <div className="flex justify-between border-b border-indigo-800 pb-2">
                                <span className="text-indigo-300">Auth Service</span>
                                <span className="font-mono text-green-400">ACTIVE</span>
                            </div>
                        </div>
                        <p className="mt-6 text-[10px] text-indigo-400 italic text-center">
                            Last Global Refresh: {new Date().toLocaleDateString()}
                        </p>
                    </div>

                    <div className="bg-slate-100 rounded-2xl p-6 border border-slate-200">
                        <h4 className="text-slate-800 font-bold text-sm mb-2 text-center">Need Support?</h4>
                        <p className="text-xs text-slate-500 text-center mb-4">Reach out if you encounter data discrepancies.</p>
                        <button className="w-full py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors">
                            Contact Admin
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}