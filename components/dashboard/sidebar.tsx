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
    ShieldCheck,
    UserCircle,
    User
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
    { name: 'Holdings', href: '/dashboard/holdings', icon: Briefcase },
    { name: 'Sales History', href: '/dashboard/sales', icon: History },
    { name: 'New Transaction', href: '/dashboard/ledger', icon: PlusCircle },
];

const secondaryItems = [{ name: 'Info & Rules', href: '/dashboard/info', icon: Info }];

// 1. Update component to accept props
export default function Sidebar({ user, profile }: { user: any, profile?: any }) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    // 2. Calculate Display Name
    const displayName = profile?.full_name || profile?.username || 'User';
    const displayEmail = user?.email || '';

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

            {/* Active User Card w/ Dropdown */}
            <div className="p-4 border-t border-slate-800">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="w-full bg-slate-800/50 rounded-xl p-3 flex items-center gap-3 border border-slate-700/50 hover:bg-slate-800 transition-colors text-left">
                            <div className="bg-indigo-500/20 p-2 rounded-full">
                                <UserCircle size={20} className="text-indigo-400" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">{displayName}</p>
                                <p className="text-[10px] text-slate-500 truncate">{displayEmail}</p>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-slate-700" align="end" forceMount>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/profile" className="cursor-pointer">
                                <User size={14} className="mr-2" />
                                Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 cursor-pointer">
                            <LogOut size={14} className="mr-2" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}