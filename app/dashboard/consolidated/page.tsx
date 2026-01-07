import { createClient } from '@/lib/supabase/server';
import ConsolidatedManager from '@/components/dashboard/consolidated-manager';

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
        .from('user_holdings') // The view we created earlier
        .select('*')
        .eq('manager_id', user?.id);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Consolidated Portfolio</h1>
                <p className="text-slate-500">Aggregate holdings across multiple family members to see total market exposure.</p>
            </header>

            <ConsolidatedManager
                initialHoldings={holdings || []}
                clients={clients || []}
            />
        </div>
    );
}