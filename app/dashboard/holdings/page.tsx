import { createClient } from '@/lib/supabase/server';
import HoldingsTable from '@/components/dashboard/holdings-table';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { redirect } from 'next/navigation'; // 1. Import redirect

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Your Holdings | Portfolio Tracker',
};

async function HoldingsDataFetcher() {
    const supabase = await createClient();

    // 2. Fetch User
    const { data: { user } } = await supabase.auth.getUser();

    // 3. FIX: Protect the route. If no user, stop and redirect.
    if (!user) {
        //redirect('/login');
        console.log("No user found");
    }

    // 4. Now safe to use user.id
    const { data, error } = await supabase
        .from('user_holdings')
        .select('*')
        .eq('manager_id', user.id)
        .order('ticker', { ascending: true });

    if (error) {
        // Log the actual error for debugging
        console.error('Error fetching holdings:', error);
        return (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                Failed to load holdings. Error: {error.message}
            </div>
        );
    }

    return <HoldingsTable holdings={data || []} />;
}

export default function HoldingsPage() {
    return (
        <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Active Holdings</h1>
                    <p className="text-slate-500 mt-1">
                        Real-time unrealized gains and batch tracking across all clients.
                    </p>
                </div>

                <div className="bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium text-slate-600">
                    Currency: <span className="text-slate-900 font-bold">INR (₹)</span>
                </div>
            </header>

            <Suspense fallback={<TableSkeleton />}>
                <HoldingsDataFetcher />
            </Suspense>
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
    );
}