import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TaxClientWrapper from './tax-client-wrapper';
import { getTodayDate } from '@/components/helper/utility';

export default async function TaxReportOverviewPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // 1. Fetch Profile to get authorized client IDs (Required for database-level Row Level Security (RLS) filtering)
    const { data: profile } = await supabase
        .from('profiles')
        .select('client_ids')
        .eq('id', user.id)
        .single();
    
    const authorizedClientIds = profile?.client_ids || [];

    const startDate = resolvedParams.start_date as string || "";
    const endDate = resolvedParams.end_date as string || getTodayDate();

    // 2. Fetch Sales from sales_view for robust aggregation (handles missing client_ids and calculates 'pl')
    const { data: sales, error } = await supabase
        .from('sales_view')
        .select('client_id, pl, adjusted_pl, long_term, is_square_off, sale_date')
        .in('client_id', authorizedClientIds);

    if (error) {
        console.error("Sales View Fetch Error:", error.message);
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Tax Overview</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Select a period to aggregate capital gains across all clients.</p>
            </header>

            <TaxClientWrapper
                initialSales={sales || []}
                initialDates={{ startDate, endDate }}
            />
        </div>
    );
}