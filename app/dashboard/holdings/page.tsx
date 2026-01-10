// app/dashboard/holdings/page.tsx
import { createClient } from '@/lib/supabase/client'; // Your Supabase server util
import HoldingsTable from '@/components/dashboard/holdings-table';
import { Suspense } from 'react';
import { Skeleton } from '@/compone-nts/ui/skeleton'; // Assuming shadcn/ui

export const metadata = {
    title: 'Your Holdings | Portfolio Tracker',
};

async function HoldingsDataFetcher() {
    const supabase = await createClient();

    // 1. Get the current logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    console.log(user);

    // 2. Fetch data from your 'user_holdings' view
    // We filter by user_id to ensure the user only sees their own data
    const { data, error } = await supabase
        .from('user_holdings') // This is the View we discussed earlier
        .select('*')
        .eq('manager_id', user?.id) // Ensure manager_id matches the logged-in user
        .order('ticker', { ascending: true });

    if (error) {
        console.error('Error fetching holdings:', error);
        return (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                Failed to load holdings. Please try refreshing the page.
            </div>
        );
    }

    // 3. Render the Client Component with the fetched data
    return <HoldingsTable holdings={data || []} />;
}

export default function HoldingsPage() {
    return (
        <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto">
            {/* Page Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Active Holdings</h1>
                    <p className="text-slate-500 mt-1">
                        Real-time unrealized gains and batch tracking across all clients.
                    </p>
                </div>

                {/* Quick Filter Info */}
                <div className="bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium text-slate-600">
                    Currency: <span className="text-slate-900 font-bold">INR (₹)</span>
                </div>
            </header>

            {/* Holdings Table with Loading State */}
            <Suspense fallback={<TableSkeleton />}>
                <HoldingsDataFetcher />
            </Suspense>
        </div>
    );
}

// Simple Skeleton for better User Experience while loading
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