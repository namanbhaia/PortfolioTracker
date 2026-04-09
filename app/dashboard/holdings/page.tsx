import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import HoldingsClientWrapper from './holdings-client-wrapper';

export default async function HoldingsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, client_ids')
        .eq('id', user.id)
        .single();

    if (!profile?.client_ids?.length) return <div className="p-4 text-slate-500">No authorized clients found. Please link a client in your profile.</div>;

    // Fetch client metadata for the dropdown
    const { data: availableClients } = await supabase
        .from('clients')
        .select('client_id, client_name')
        .in('client_id', profile.client_ids);

    // Fetch all relevant holdings for the authorized clients at once
    const { data: holdings, error } = await supabase
        .from('client_holdings')
        .select('*')
        .in('client_id', profile.client_ids)
        .order('date', { ascending: false });

    if (error) {
        console.error("Supabase Error:", error.message);
        return <div className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200">Error loading portfolio data: {error.message}</div>;
    }

    return (
        <HoldingsClientWrapper
            initialHoldings={holdings || []}
            availableClients={availableClients || []}
        />
    );
}