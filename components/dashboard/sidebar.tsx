"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Briefcase,
    History,
    PlusCircle,
    Info,
    LogOut,
    ShieldCheck
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Holdings', href: '/dashboard/holdings', icon: Briefcase },
    { name: 'Sales History', href: '/dashboard/sales', icon: History },
    { name: 'New Transaction', href: '/dashboard/ledger', icon: PlusCircle },
];

const secondaryItems = [
    { name: 'Info & Rules', href: '/info', icon: Info },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <aside className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
            {/* Brand Logo */}
            <div className="p-6 flex items-center gap-3 text-white">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                    <ShieldCheck size={24} />
                </div>
                <span className="font-bold text-lg tracking-tight">WealthTrack</span>
            </div>

            {/* Primary Navigation */}
            <nav className="flex-1 px-4 space-y-1 mt-4">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Main Menu</p>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${isActive
                                    ? 'bg-indigo-600 text-white'
                                    : 'hover:bg-slate-800 hover:text-slate-100'
                                }`}
                        >
                            <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Secondary & Help */}
            <div className="px-4 space-y-1 mb-4">
                {secondaryItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium hover:text-slate-100 transition-colors"
                    >
                        <item.icon size={18} />
                        {item.name}
                    </Link>
                ))}
            </div>

            {/* User Session / Logout */}
            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}