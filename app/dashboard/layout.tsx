"use client";

import Sidebar from '@/components/dashboard/sidebar';
import { UserProvider, useUser } from '@/lib/context/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        // You can return a loading spinner or a skeleton layout here
        return (
             <div className="flex h-screen bg-slate-50 overflow-hidden">
                <aside className="w-64 h-screen bg-slate-900 border-r border-slate-800 animate-pulse" />
                <main className="flex-1 overflow-y-auto relative">
                    <div className="min-h-full p-6">
                        <div className="animate-pulse">
                            <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
                            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!user) {
        // This is to prevent flashing the content for a moment before redirect
        return null;
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto relative">
                <div className="min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <UserProvider>
            <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </UserProvider>
    );
}
