import Sidebar from '@/components/dashboard/sidebar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    // 1. Fetch User & Profile Server-Side
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // 2. Fetch Profile details (for Full Name / Username)
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* 3. Pass data to Sidebar */}
            <Sidebar user={user} profile={profile} />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto relative">
                <div className="min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}