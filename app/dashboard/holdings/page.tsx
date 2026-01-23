import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import HoldingsFilters from '@/components/dashboard/holdings-filters';
import TrxIdCell from '@/components/dashboard/trx-id-cell'; 
import CommentCell from '@/components/dashboard/comment-cell';
import HoldingsTable from '@/components/dashboard/holdings-table';

// Define the valid sortable columns based on your view
type SortField = 'client_name' | 'ticker' | 'stock_name' | 'date' | 'pl_percent' | 'pl' | 'is_long_term';

export default async function HoldingsPage({
    searchParams,
}: {
    searchParams: Promise<{
        ticker?: string;
        share_name?: string;
        client_name?: string;
        show_all?: string;
        start_date?: string;
        end_date?: string;
        is_long_term?: string;
    }>;
}) {
    const supabase = await createClient();
    const params = await searchParams;

    // 1. Types & Default sorting
    type SortField = 'date' | 'ticker' | 'client_name' | 'market_value' | 'pl_percent';
    const sortField = (params.sort as SortField) || 'date';
    const sortOrder = params.order === 'asc'; // true for ASC, false for DESC (default)

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, client_ids')
        .eq('id', user.id)
        .single();

    if (!profile?.client_ids?.length) return <div>No authorized clients.</div>;

    // Fetch client metadata for the dropdown
    const { data: availableClients } = await supabase
        .from('clients')
        .select('client_id, client_name')
        .in('client_id', profile.client_ids);

    // 2. Base Query
    let query = supabase.from('client_holdings').select('*');

    // 3. Security: Filter by Client IDs (Multiple select support)
    let authorizedClientIds = profile.client_ids;
    if (params.client_ids) {
        const selectedClientIds = params.client_ids.split(',');
        // Only filter by IDs the user actually has access to
        authorizedClientIds = selectedClientIds.filter(id => profile.client_ids.includes(id));
    }
    query = query.in('client_id', authorizedClientIds);

    // 4. Client Name (Exact match case-insensitive, if passed as string)
    if (params.client_name) {
        query = query.ilike('client_name', params.client_name);
    }

    // 5. Ticker (Exact match, case-insensitive)
    if (params.ticker) {
        query = query.ilike('ticker', params.ticker);
    }

    // 6. Share Name (Partial match)
    if (params.share_name) {
        query = query.ilike('stock_name', `%${params.share_name}%`);
    }

    // 7. Date Range
    if (params.start_date) query = query.gte('date', params.start_date);
    if (params.end_date) query = query.lte('date', params.end_date);
    
    // 8. Balance Filtering (Default: Active Only)
    if (params.show_all !== 'true') {
        query = query.gt('balance_qty', 0);
    }  
    
    if (params.is_long_term === 'true') {
        query = query.eq('is_long_term', true);
    } else if (params.is_long_term === 'false') {
        query = query.eq('is_long_term', false);
    }
    // 10. Execute Query with Sorting
    const { data: holdings, error } = await query.order(sortField, { ascending: sortOrder });

    if (error) {
        console.error("Supabase Error:", error.message);
        return <div className="p-4 text-red-500 bg-red-50 rounded-lg">Error loading portfolio data.</div>;
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
            <h1 className="text-2xl font-bold">Portfolio Holdings:</h1>
            <HoldingsFilters availableClients={availableClients || []} />

            <HoldingsTable holdings={holdings || []} params={params} />
        </div>
    );
}