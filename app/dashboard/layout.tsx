import Sidebar from '@/components/dashboard/sidebar';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserProvider } from '@/components/helper/user-context'
import Screensaver from '@/components/dashboard/screensaver';

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

            <div className="flex h-screen bg-slate-50 overflow-hidden">
                <Screensaver idleTimeout={300000} /> {/* 10 Minutes */}
                {/* 3. Pass data to Sidebar */}
                <Sidebar user={user} profile={profile} />

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto relative">
                    <div className="min-h-full">
                        {children}
                    </div>
                </main>
            </div>
        </UserProvider>
    );
}