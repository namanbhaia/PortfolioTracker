import { createClient } from '@/lib/supabase/server';
import SalesTable from '@/components/dashboard/sales-table';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
    title: 'Sales History | WealthTrack',
};

async function SalesDataFetcher() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Query the updated sales_view that includes user_id and custom_id
    const { data, error } = await supabase
        .from('sales_view')
        .select('*')
        .eq('user_id', user?.id)
        .order('sale_date', { ascending: false });

    if (error) {
        console.error('Error fetching sales:', error);
        return <div className="p-8 text-red-500 bg-red-50 rounded-xl border border-red-100">Error loading sales data. Please refresh.</div>;
    }

    return <SalesTable data={data || []} />;
}

export default function SalesPage() {
    return (
        <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sales History</h1>
                    <p className="text-slate-500 mt-1">Realized performance and batch-linked exit logs across all clients.</p>
                </div>

                <div className="bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium text-slate-600">
                    Reporting: <span className="text-slate-900 font-bold">Realized P&L</span>
                </div>
            </header>

            <Suspense fallback={<TableSkeleton />}>
                <SalesDataFetcher />
            </Suspense>
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <div className="border rounded-xl p-4 space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
            </div>
        </div>
    );
}