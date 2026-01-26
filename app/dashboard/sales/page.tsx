"use client";

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/context/UserContext';
import HoldingsFilters from '@/components/dashboard/holdings-filters';
import SalesTable from '@/components/dashboard/sales-table';
import { RefreshButton } from '@/components/dashboard/refresh-button';

type SortField = 'client_name' | 'ticker' | 'stock_name' | 'sale_date' | 'pl_percent' | 'pl' | 'is_long_term';

export default function SalesPage() {
    const { profile, clients: availableClients, loading: userLoading, error: userError } = useUser();
    const supabase = useMemo(() => createClient(), []);
    const searchParams = useSearchParams();

    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const params = useMemo(() => ({
        ticker: searchParams.get('ticker') || undefined,
        share_name: searchParams.get('share_name') || undefined,
        client_name: searchParams.get('client_name') || undefined,
        start_date: searchParams.get('start_date') || undefined,
        end_date: searchParams.get('end_date') || undefined,
        is_long_term: searchParams.get('is_long_term') || undefined,
        sort: searchParams.get('sort') || 'sale_date',
        order: searchParams.get('order') || 'desc',
        client_ids: searchParams.get('client_ids') || undefined,
    }), [searchParams]);

    useEffect(() => {
        const fetchSales = async () => {
            if (!profile?.client_ids?.length) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const sortField = (params.sort as SortField) || 'sale_date';
                const sortOrder = params.order === 'asc';

                let query = supabase.from('sales_view').select('*');

                let authorizedClientIds = profile.client_ids;
                if (params.client_ids) {
                    const selectedClientIds = params.client_ids.split(',');
                    authorizedClientIds = selectedClientIds.filter(id => profile.client_ids.includes(id));
                }
                query = query.in('client_id', authorizedClientIds);

                if (params.client_name) query = query.ilike('client_name', params.client_name);
                if (params.ticker) query = query.ilike('ticker', params.ticker);
                if (params.share_name) query = query.ilike('stock_name', `%${params.share_name}%`);
                if (params.start_date) query = query.gte('sale_date', params.start_date);
                if (params.end_date) query = query.lte('sale_date', params.end_date);
                if (params.is_long_term === 'true') query = query.eq('is_long_term', true);
                else if (params.is_long_term === 'false') query = query.eq('is_long_term', false);

                const { data, error: queryError } = await query.order(sortField, { ascending: sortOrder });

                if (queryError) throw queryError;
                setSales(data || []);

            } catch (e: any) {
                console.error("Supabase Error:", e.message);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        if (!userLoading) {
            fetchSales();
        }
    }, [profile, params, userLoading, supabase]);

    if (userLoading || loading) {
        return <div className="p-4">Loading sales data...</div>;
    }

    if (userError) {
        return <div className="p-4 text-red-500 bg-red-50 rounded-lg">Error loading user data: {userError}</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500 bg-red-50 rounded-lg">Error loading sales data: {error}</div>;
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
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sales History</h1>
                 <div className="flex items-center gap-3"><RefreshButton /></div>
            </header>

            <HoldingsFilters availableClients={availableClients || []} showBalanceToggle={false} />
            <SalesTable sales={sales || []} params={params} />
        </div>
    );
}
