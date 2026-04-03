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
    BadgeDollarSign,
    FileCheck,
    FileSpreadsheet,
    ShieldCheck,
    Wrench,
    Lightbulb,
    Menu,
    X
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { createClient } from '@/lib/supabase/client';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLoading } from '@/components/helper/loading-context';

const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Purchase History', href: '/dashboard/holdings', icon: Briefcase },
    { name: 'Sales History', href: '/dashboard/sales', icon: History },
    { name: 'Transactions', href: '/dashboard/transactions-lookup', icon: Search },
    { name: 'New Transaction', href: '/dashboard/ledger', icon: PlusCircle },
    { name: 'Pledging', href: '/dashboard/pledging', icon: ShieldCheck },
    { name: 'Verification', href: '/dashboard/verification', icon: FileCheck },
    { name: 'Recommendations', href: '/dashboard/recommendations', icon: Lightbulb },
];

const secondaryItems = [
    { name: 'Export Data', href: '/dashboard/export', icon: FileSpreadsheet },
    { name: 'Tax Calculation', href: '/dashboard/tax', icon: BadgeDollarSign },
    { name: 'Info & Rules', href: '/dashboard/info', icon: Info },
];

const adminItems = [
    { name: 'Admin Controls', href: '/dashboard/admin', icon: Wrench }
];

export default function MobileNav({ user, profile }: { user: any, profile?: any }) {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const { setIsLoading } = useLoading();

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent scrolling when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            // clean up just in case
        };
    }, [isOpen]);

    if (!mounted) {
        return <div className="md:hidden h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" />;
    }

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    const displayName = profile?.full_name || profile?.username || 'User';
    const displayEmail = user?.email || '';

    return (
        <div className="md:hidden">
            {/* Top Navigation Bar */}
            <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shadow-sm">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-1 -ml-1 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 rounded-md transition-colors"
                        aria-label="Toggle menu"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('activate-screensaver'))}>
                        <img
                            src="/images/logo_2.png"
                            alt="MLB Logo"
                            className="h-6 w-6 rounded border border-indigo-200 dark:border-indigo-900 shadow-sm"
                        />
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-tight">MLB<span className="text-indigo-600 dark:text-indigo-400">Tracker</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center justify-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                                <UserCircle size={22} className="text-indigo-500 dark:text-indigo-400" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2">
                            <div className="px-2 py-1.5 overflow-hidden">
                                <p className="text-sm font-bold truncate">{displayName}</p>
                                <p className="text-[10px] text-slate-500 truncate">{displayEmail}</p>
                            </div>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link 
                                    href="/dashboard/profile" 
                                    className="cursor-pointer flex items-center gap-2 w-full"
                                    onClick={() => {
                                        if (pathname !== '/dashboard/profile') setIsLoading(true);
                                    }}
                                >
                                    <User size={16} />
                                    <span>Profile Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLogout} className="text-rose-500 cursor-pointer flex items-center gap-2">
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Slide-out Menu Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Slide-out Menu Panel */}
            <aside
                className={`fixed top-14 bottom-0 left-0 z-30 w-72 bg-slate-900 text-slate-300 transform transition-transform duration-300 ease-in-out border-r border-slate-800 shadow-2xl overflow-y-auto ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="py-4 px-3 space-y-6">
                    {/* Primary */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 opacity-60">
                            Main Menu
                        </p>
                        <nav className="space-y-1">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => {
                                            if (pathname !== item.href) setIsLoading(true);
                                        }}
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
                                        <span className="truncate">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Secondary */}
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 opacity-60">
                            Tools
                        </p>
                        <div className="space-y-1">
                            {secondaryItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => {
                                        if (pathname !== item.href) setIsLoading(true);
                                    }}
                                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-800 hover:text-slate-100 transition-colors group"
                                >
                                    <item.icon size={18} className="shrink-0 text-slate-500 group-hover:text-slate-300" />
                                    <span className="truncate">{item.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Admin */}
                    {profile?.admin_level >= 1 && (
                        <div>
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest px-3 mb-2 opacity-80 mt-2">
                                Admin Controls
                            </p>
                            <div className="space-y-1">
                                {adminItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => {
                                                if (pathname !== item.href) setIsLoading(true);
                                            }}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group ${
                                                isActive
                                                    ? 'bg-rose-600/20 text-rose-400 border border-rose-500/30'
                                                    : 'hover:bg-slate-800 hover:text-slate-100'
                                            }`}
                                        >
                                            <item.icon size={18} className={`shrink-0 ${isActive ? 'text-rose-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                            <span className="truncate">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </div>
    );
}
