import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ClientDashboard from '@/components/dashboard/client-dashboard';

export default async function ConsolidatedPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('client_ids')
        .eq('id', user.id)
        .single();

    if (!profile?.client_ids?.length) return <div>No authorized clients.</div>;

    // 3. Fetch data with dynamic sorting
    const { data: holdings } = await supabase
        .from('client_holdings')
        .select('*')
        .in('client_id', profile.client_ids);

    const authorizedIds = profile.client_ids;

    // 2. Query the clients table using the .in() filter
    const { data: clients } = await supabase
        .from('clients')
        .select('client_id, client_name, trading_id, dp_id') // Added client_id for your form logic
        .in('client_id', authorizedIds);

    return (
        <ClientDashboard
            clients={clients || []}
            holdings={holdings || []}
            profile={profile}
        />
    );
}