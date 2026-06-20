import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import DeadCompaniesClient from './dead-companies-client';

/**
 * @file page.tsx
 * @description Server-side page for the Dead Companies admin tool.
 * Verifies admin_level >= 1, fetches all distinct tickers held by clients
 * alongside their current `dead` status, and passes them to the client component.
 *
 * Data strategy: query `assets` table directly (source of truth) rather than joining
 * through the `client_holdings` view, which may not materialise foreign-key relations.
 */
export default async function DeadCompaniesPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return redirect('/login');

    // Fetch profile to verify admin access
    const { data: profile } = await supabase
        .from('profiles')
        .select('admin_level')
        .eq('id', user.id)
        .single();

    if (!profile || (profile.admin_level ?? 0) < 1) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-full mb-4">
                    <ShieldAlert size={48} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access Restricted</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
                    You do not have permission to manage dead companies. Admin level 1 or higher is required.
                </p>
            </div>
        );
    }

    // Step 1: Collect all distinct tickers held by any client
    const { data: holdingRows, error: holdingsError } = await supabase
        .from('client_holdings')
        .select('ticker');

    if (holdingsError) {
        return (
            <div className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200">
                Error loading holdings data: {holdingsError.message}
            </div>
        );
    }

    const distinctTickers = [...new Set((holdingRows ?? []).map((r) => r.ticker).filter(Boolean))].sort();

    // Step 2: Read dead flag + name directly from the assets table (source of truth)
    const { data: assetRows, error: assetsError } = await supabase
        .from('assets')
        .select('ticker, stock_name, dead')
        .in('ticker', distinctTickers)
        .order('ticker', { ascending: true });

    if (assetsError) {
        return (
            <div className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200">
                Error loading asset data: {assetsError.message}
            </div>
        );
    }

    const tickers = (assetRows ?? []).map((a) => ({
        ticker: a.ticker,
        dead: a.dead ?? false,
        stockName: a.stock_name ?? a.ticker,
    }));

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <DeadCompaniesClient initialTickers={tickers} />
        </div>
    );
}
