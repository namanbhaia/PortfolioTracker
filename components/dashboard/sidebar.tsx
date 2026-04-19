"use client"

/**
 * @file sidebar.tsx
 * @description Main navigation sidebar for the dashboard, handling routing, session management, and UI state (collapsed/expanded).
 */

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
    BadgeDollarSign,
    FileCheck,
    FileSpreadsheet,
    ShieldCheck,
    Wrench,
    Lightbulb,
    Moon,
    Sun,
    Bell
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLoading } from '@/components/helper/loading-context';
import { useUser } from '@/components/helper/user-context';
import { AlertsBell } from './alerts-bell';

const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Purchase History', href: '/dashboard/holdings', icon: Briefcase },
    { name: 'Sales History', href: '/dashboard/sales', icon: History },
    { name: 'Transactions Lookup', href: '/dashboard/transactions-lookup', icon: Search },
    { name: 'New Transaction', href: '/dashboard/ledger', icon: PlusCircle },
    { name: 'Pledging', href: '/dashboard/pledging', icon: ShieldCheck },
    { name: 'Verification', href: '/dashboard/verification', icon: FileCheck },
    { name: 'Recommendations', href: '/dashboard/recommendations', icon: Lightbulb },
];

const secondaryItems = [
    { name: 'Tax Calculation', href: '/dashboard/tax', icon: BadgeDollarSign },
];

const adminItems = [
    { name: 'Admin Controls', href: '/dashboard/admin', icon: Wrench }
];

/**
 * Sidebar component for dashboard navigation.
 * @param {Object} props - Component props.
 * @param {any} props.user - The current user object.
 * @param {any} [props.profile] - The user's profile metadata.
 */
export default function Sidebar({ user, profile }: { user: any, profile?: any }) {
    // 1. Declare ALL hooks at the top level
    const [mounted, setMounted] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const { setIsLoading } = useLoading();
    const { autoFoldSidebar } = useUser();
    const [isManuallyToggled, setIsManuallyToggled] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // If auto-fold is enabled, the toggle pins it open. Otherwise, the toggle pins it closed.
    const isCollapsed = autoFoldSidebar 
        ? (!isHovered && !isManuallyToggled) 
        : isManuallyToggled;

    // Only set mounted to true after the initial render
    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent hydration mismatch by returning a consistent shell 
    // or null until the client has taken over
    if (!mounted) {
        return <aside className="w-20 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800" />;
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
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`hidden md:flex relative h-screen bg-slate-900 text-slate-300 flex-col border-r border-slate-800 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* FLOATING TOGGLE BUTTON */}
            <button
                onClick={() => setIsManuallyToggled(!isManuallyToggled)}
                className="absolute -right-3 top-10 z-50 bg-indigo-600 text-white rounded-full p-1 border-2 border-slate-900 hover:bg-indigo-500 transition-all shadow-xl hover:scale-110 active:scale-95"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            {/* Brand Logo Section */}

            <div className="p-6 mb-2 flex items-center gap-3 text-white overflow-hidden">
                <div
                    onClick={() => {
                        window.dispatchEvent(new CustomEvent('activate-screensaver'));
                    }}
                    className="flex items-center gap-3 group cursor-pointer"
                    title="Privacy Mode: Hide sensitive info"
                >
                    <div className="shrink-0 transition-transform group-hover:scale-110 active:scale-90 duration-300">
                        <img
                            src="/images/logo_2.png"
                            alt="MLB Portfolio Tracker Logo"
                            className="h-8 w-8 rounded-lg object-contain drop-shadow-[0_0_8px_rgba(79,70,229,0.3)]"
                        />
                    </div>
                    {!isCollapsed && (
                        <span className="font-bold text-lg tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300 group-hover:text-indigo-400 transition-colors">
                            MLBPortfolioTracker
                        </span>
                    )}
                </div>
            </div>

            {/* Notification Bell section */}
            <div className="px-3 mb-2">
                <AlertsBell showLabel={!isCollapsed} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all group hover:bg-slate-800 hover:text-slate-100 text-slate-300" />
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
                            onClick={() => {
                                if (pathname !== item.href) setIsLoading(true);
                            }}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${isActive
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
            <div className="px-3 space-y-1 mb-4 border-t border-slate-800/50 pt-4 mt-4">
                <Link
                    href="/dashboard/alerts"
                    onClick={() => {
                        if (pathname !== '/dashboard/alerts') setIsLoading(true);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors group"
                >
                    <Bell size={18} className="shrink-0 text-slate-500 group-hover:text-amber-400" />
                    {!isCollapsed && <span className="truncate">Configure Alerts</span>}
                </Link>
                {secondaryItems.map((item) => (
                    <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => {
                            if (pathname !== item.href) setIsLoading(true);
                        }}
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
                        <button className={`flex items-center gap-3 rounded-xl transition-all outline-none ${isCollapsed
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
                        className="w-56"
                        side={isCollapsed ? "right" : "top"}
                        align={isCollapsed ? "start" : "center"}
                    >
                        <DropdownMenuItem asChild>
                            <Link 
                                href="/dashboard/profile" 
                                className="cursor-pointer flex items-center gap-2"
                                onClick={() => {
                                    if (pathname !== '/dashboard/profile') setIsLoading(true);
                                }}
                            >
                                <User size={16} />
                                <span>Profile Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link 
                                href="/dashboard/info" 
                                className="cursor-pointer flex items-center gap-2"
                                onClick={() => {
                                    if (pathname !== '/dashboard/info') setIsLoading(true);
                                }}
                            >
                                <Info size={16} />
                                <span>Info & Rules</span>
                            </Link>
                        </DropdownMenuItem>
                        {profile?.admin_level >= 1 && (
                            <DropdownMenuItem asChild>
                                <Link 
                                    href="/dashboard/admin" 
                                    className="cursor-pointer flex items-center gap-2"
                                    onClick={() => {
                                        if (pathname !== '/dashboard/admin') setIsLoading(true);
                                    }}
                                >
                                    <Wrench size={16} />
                                    <span>Admin Controls</span>
                                </Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                            <Link 
                                href="/dashboard/export" 
                                className="cursor-pointer flex items-center gap-2"
                                onClick={() => {
                                    if (pathname !== '/dashboard/export') setIsLoading(true);
                                }}
                            >
                                <FileSpreadsheet size={16} />
                                <span>Export Data</span>
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