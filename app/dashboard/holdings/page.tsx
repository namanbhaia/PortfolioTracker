"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/context/UserContext';
import HoldingsFilters from '@/components/dashboard/holdings-filters';
import HoldingsTable from '@/components/dashboard/holdings-table';
import { RefreshButton } from '@/components/dashboard/refresh-button';

type SortField = 'client_name' | 'ticker' | 'stock_name' | 'date' | 'pl_percent' | 'pl' | 'is_long_term';

export default function HoldingsPage() {
    const { profile, clients: availableClients, loading: userLoading, error: userError } = useUser();
    const supabase = useMemo(() => createClient(), []);
    const searchParams = useSearchParams();

    const [holdings, setHoldings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Memoize search params to prevent re-renders
    const params = useMemo(() => ({
        ticker: searchParams.get('ticker') || undefined,
        share_name: searchParams.get('share_name') || undefined,
        client_name: searchParams.get('client_name') || undefined,
        show_all: searchParams.get('show_all') || undefined,
        start_date: searchParams.get('start_date') || undefined,
        end_date: searchParams.get('end_date') || undefined,
        is_long_term: searchParams.get('is_long_term') || undefined,
        sort: searchParams.get('sort') || 'date',
        order: searchParams.get('order') || 'desc',
        client_ids: searchParams.get('client_ids') || undefined,
    }), [searchParams]);

    useEffect(() => {
        const fetchHoldings = async () => {
            if (!profile?.client_ids?.length) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const sortField = (params.sort as SortField) || 'date';
                const sortOrder = params.order === 'asc';

                let query = supabase.from('client_holdings').select('*');

                // Security: Filter by authorized client IDs from context
                let authorizedClientIds = profile.client_ids;
                if (params.client_ids) {
                    const selectedClientIds = params.client_ids.split(',');
                    authorizedClientIds = selectedClientIds.filter(id => profile.client_ids.includes(id));
                }
                query = query.in('client_id', authorizedClientIds);

                // Apply other filters from search params
                if (params.client_name) query = query.ilike('client_name', params.client_name);
                if (params.ticker) query = query.ilike('ticker', params.ticker);
                if (params.share_name) query = query.ilike('stock_name', `%${params.share_name}%`);
                if (params.start_date) query = query.gte('date', params.start_date);
                if (params.end_date) query = query.lte('date', params.end_date);
                if (params.show_all !== 'true') query = query.gt('balance_qty', 0);
                if (params.is_long_term === 'true') query = query.eq('is_long_term', true);
                else if (params.is_long_term === 'false') query = query.eq('is_long_term', false);

                // Execute query with sorting
                const { data, error: queryError } = await query.order(sortField, { ascending: sortOrder });

                if (queryError) throw queryError;
                setHoldings(data || []);

            } catch (e: any) {
                console.error("Supabase Error:", e.message);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        if (!userLoading) {
            fetchHoldings();
        }
    }, [profile, params, userLoading, supabase]);

    if (userLoading || loading) {
        return <div className="p-4">Loading holdings...</div>;
    }

    if (userError) {
        return <div className="p-4 text-red-500 bg-red-50 rounded-lg">Error loading user data: {userError}</div>;
    }

    if (error) {
         return <div className="p-4 text-red-500 bg-red-50 rounded-lg">Error loading portfolio data.</div>;
    }

    if (!profile?.client_ids?.length) {
        return <div className="p-4">No authorized clients found for your profile.</div>;
    }

    // Helper function to create sort URLs
    const getSortLink = (field: SortField) => {
        const newOrder = params.sort === field && params.order === 'asc' ? 'desc' : 'asc';
        return `?sort=${field}&order=${newOrder}`;
    };

    // Helper to render sort arrow
    const SortArrow = ({ field }: { field: SortField }) => {
        if (params.sort !== field) return <span className="text-gray-300 ml-1">↕</span>;
        return params.order === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
    };

    return (
        <div className="p-4 space-y-4">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Portfolio Holdings</h1>
                <div className="flex items-center gap-3"><RefreshButton /></div>
            </header>
            <HoldingsFilters availableClients={availableClients || []} showBalanceToggle={true} />
            <HoldingsTable holdings={holdings || []} params={params} />
        </div>
    );
}
