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

    const startDate = resolvedParams.start_date as string || "";
    const endDate = resolvedParams.end_date as string || getTodayDate();

    // Fetch clients
    const { data: clients } = await supabase
        .from('clients')
        .select('client_id, client_name')
        .order('client_name');

    // Fetch all sales for authorized clients (to allow client-side filtering)
    // We only fetch the minimal columns needed for the overview
    const { data: sales } = await supabase
        .from('sales')
        .select('client_id, profit_stored, long_term, adjusted_profit_stored, is_square_off, date');

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Tax Overview</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Select a period to aggregate capital gains across all clients.</p>
            </header>

            <TaxClientWrapper
                initialClients={clients || []}
                initialSales={sales || []}
                initialDates={{ startDate, endDate }}
            />
        </div>
    );
}