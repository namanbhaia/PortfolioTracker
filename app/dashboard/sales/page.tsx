import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SalesClientWrapper from './sales-client-wrapper';

export default async function SalesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
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

    // Fetch all sales for authorized clients
    const { data: sales, error } = await supabase
        .from('sales_view')
        .select('*')
        .in('client_id', profile.client_ids)
        .order('sale_date', { ascending: false });

    if (error) {
        console.error("Supabase Error:", error.message);
        return <div className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200">Error loading portfolio data: {error.message}</div>;
    }

    // Extract initial filters from searchParams
    const initialFilters = {
        ticker: (resolvedParams.ticker as string) || "",
        startDate: (resolvedParams.start_date as string) || "",
        endDate: (resolvedParams.end_date as string) || "",
        clientIds: typeof resolvedParams.client_ids === 'string'
            ? resolvedParams.client_ids.split(',')
            : Array.isArray(resolvedParams.client_ids)
                ? resolvedParams.client_ids
                : typeof resolvedParams.client_id === 'string'
                    ? [resolvedParams.client_id]
                    : []
    };

    return (
        <div className="p-4 space-y-4 mx-auto">
            <SalesClientWrapper
                initialSales={sales || []}
                availableClients={availableClients || []}
                initialFilters={initialFilters}
            />
        </div>
    );
}