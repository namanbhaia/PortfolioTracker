"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Briefcase,
    History,
    PlusCircle,
    Info,
    LogOut,
    UserCircle,
    User,
    Search,
    ChevronLeft,
    ChevronRight,
    BadgeDollarSign
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Purchase History', href: '/dashboard/holdings', icon: Briefcase },
    { name: 'Sales History', href: '/dashboard/sales', icon: History },
    { name: 'Transactions Lookup', href: '/dashboard/transactions-lookup', icon: Search },
    { name: 'New Transaction', href: '/dashboard/ledger', icon: PlusCircle },
];

const secondaryItems = [
    { name: 'Tax Calculation', href: '/dashboard/tax', icon: BadgeDollarSign },
    { name: 'Info & Rules', href: '/dashboard/info', icon: Info }
];

export default function Sidebar({ user, profile }: { user: any, profile?: any }) {
    // 1. Declare ALL hooks at the top level
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname(); 
    const router = useRouter();     
    const supabase = createClient();
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Only set mounted to true after the initial render
    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by returning a consistent shell 
    // or null until the client has taken over
    if (!mounted) {
        return <aside className="w-20 h-screen bg-slate-900 border-r border-slate-800" />;
    }


    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    const displayName = profile?.full_name || profile?.username || 'User';
    const displayEmail = user?.email || '';

    return (
        <aside 
            className={`relative h-screen bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-all duration-300 ease-in-out ${
                isCollapsed ? 'w-20' : 'w-64'
            }`}
        >
            {/* FLOATING TOGGLE BUTTON */}
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-10 z-50 bg-indigo-600 text-white rounded-full p-1 border-2 border-slate-900 hover:bg-indigo-500 transition-all shadow-xl hover:scale-110 active:scale-95"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Brand Logo Section */}
            
            <div className="p-6 mb-2 flex items-center gap-3 text-white overflow-hidden">
                <Link href="/dashboard" className="flex items-center gap-3 group">
                    <div className="shrink-0 transition-transform group-hover:scale-105 active:scale-95">
                        {/* This "/" points directly to your "public" folder. 
                            Next.js automatically serves everything inside "public" at the root URL.
                        */}
                        <img 
                            src="/images/logo_2.png" 
                            alt="PortfolioTracker Logo" 
                            className="h-8 w-8 rounded-lg object-contain" 
                        />
                    </div>
                    {!isCollapsed && (
                        <span className="font-bold text-lg tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                            PortfolioTracker
                        </span>
                    )}
                </Link>
            </div>

            {/* Primary Navigation */}
            <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto overflow-x-hidden">
                {!isCollapsed && (
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-4 opacity-60">
                        Main Menu
                    </p>
                )}
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={isCollapsed ? item.name : ""}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                                isActive 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                    : 'hover:bg-slate-800 hover:text-slate-100'
                            }`}
                        >
                            <item.icon 
                                size={20} 
                                className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} 
                            />
                            {!isCollapsed && <span className="truncate">{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Secondary Items */}
            <div className="px-3 space-y-1 mb-4">
                {secondaryItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium hover:text-slate-100 transition-colors group"
                    >
                        <item.icon size={18} className="shrink-0 text-slate-500 group-hover:text-slate-300" />
                        {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </Link>
                ))}
            </div>

            {/* User Profile Footer */}
            <div className={`p-4 border-t border-slate-800 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={`flex items-center gap-3 rounded-xl transition-all outline-none ${
                            isCollapsed 
                                ? 'p-2 justify-center hover:bg-slate-800 w-full' 
                                : 'p-3 w-full bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800'
                        }`}>
                            <div className="bg-indigo-500/20 p-2 rounded-lg shrink-0">
                                <UserCircle size={20} className="text-indigo-400" />
                            </div>
                            {!isCollapsed && (
                                <div className="text-left overflow-hidden">
                                    <p className="text-sm font-bold text-white truncate leading-tight">{displayName}</p>
                                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{displayEmail}</p>
                                </div>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    
                    <DropdownMenuContent 
                        className="w-56 bg-slate-800 border-slate-700 text-slate-200" 
                        side={isCollapsed ? "right" : "top"} 
                        align={isCollapsed ? "start" : "center"}
                    >
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/profile" className="cursor-pointer flex items-center gap-2">
                                <User size={16} />
                                <span>Profile Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem onClick={handleLogout} className="text-rose-400 cursor-pointer flex items-center gap-2">
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}