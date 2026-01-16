import { createClient } from '@/lib/supabase/server';
import ClientDashboard from '@/components/dashboard/client-dashboard';

export default async function ConsolidatedPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch all clients managed by this user
    const { data: clients } = await supabase
        .from('clients')
        .select('client_name, trading_id')
        .eq('user_id', user?.id);

    // 2. Fetch all active holdings across all clients
    const { data: holdings } = await supabase
        .from('client_holdings') // The view we created earlier
        .select('*')
        .eq('manager_id', user?.id);

    // 3. Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

    return (
        <ClientDashboard
            clients={clients || []}
            holdings={holdings || []}
            profile={profile}
        />
    );
}