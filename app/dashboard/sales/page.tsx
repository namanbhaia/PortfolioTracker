import { createClient } from '@/lib/supabase/server';
import SalesTable from '@/components/dashboard/sales-table';
import { Suspense } from 'react';

export default async function SalesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: sales, error } = await supabase
        .from('sales_view') // Your database view
        .select('*')
        .eq('user_id', user?.id)
        .order('sale_date', { ascending: false });

    if (error) return <div className="p-8 text-red-500">Error loading sales data.</div>;

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Sales History</h1>
                <p className="text-slate-500 mt-1">Realized profits and tax reporting for all closed positions.</p>
            </header>

            <Suspense fallback={<div>Loading Ledger...</div>}>
                <SalesTable data={sales || []} />
            </Suspense>
        </div>
    );
}