/**
 * @file layout.tsx
 * @description The main layout for the dashboard, handling authentication, global state initialization, and common UI elements like the sidebar and screensaver.
 */

import Sidebar from '@/components/dashboard/sidebar';
import MobileNav from '@/components/dashboard/mobile-nav';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserProvider } from '@/components/helper/user-context'
import Screensaver from '@/components/dashboard/screensaver';
import { LoadingProvider } from '@/components/helper/loading-context';
import { Suspense } from 'react';

/**
 * Dashboard Layout component that provides authentication and context for all dashboard pages.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child nodes representing the current dashboard route's content.
 */
export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    // 1. Fetch User & Profile Server-Side
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { redirect('/login'); }

    // 2. Fetch Profile details (for Full Name / Username)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const { data: clients } = await supabase
        .from('clients')
        .select('client_id, client_name, trading_id, dp_id')
        .in('client_id', profile?.client_ids || []);

    return (
        <UserProvider
            initialUser={user}
            initialProfile={profile}
            initialClients={clients || []
            }>
            <Suspense fallback={null}>
                <LoadingProvider>
                    <div className="flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
                        <Screensaver idleTimeout={300000} /> {/* 10 Minutes */}
                        
                        {/* Mobile Navigation */}
                        <MobileNav user={user} profile={profile} />

                        {/* 3. Pass data to Sidebar (Desktop) */}
                        <Sidebar user={user} profile={profile} />

                        {/* Main Content Area */}
                        <main className="flex-1 overflow-auto relative pt-14 md:pt-0">
                            <div className="min-h-full">
                                {children}
                            </div>
                        </main>
                    </div>
                </LoadingProvider>
            </Suspense>
        </UserProvider>
    );
}