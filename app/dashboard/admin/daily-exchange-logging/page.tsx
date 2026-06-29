import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DailyLoggingClient } from './logging-client';


export const metadata = {
    title: 'Daily Exchange Logging | Admin'
};


export default async function DailyExchangeLoggingPage() {
    const supabase = await createClient();


    // 1. Identity & Admin Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');


    const { data: profile } = await supabase
        .from('profiles')
        .select('admin_level')
        .eq('id', user.id)
        .single();


    if (!profile || Number(profile.admin_level || 0) < 1) {
        redirect('/dashboard');
    }


    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Daily Exchange Logging</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload NSE/BSE daily trade logs to atomically ingest purchases, sales, and execute FIFO ledger mappings.
                </p>
            </div>
            <DailyLoggingClient />
        </div>
    );
}
