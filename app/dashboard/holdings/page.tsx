import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import HoldingsFilters from '@/components/dashboard/holdings-filters';
import TrxIdCell from '@/components/dashboard/trx-id-cell'; 
import CommentCell from '@/components/dashboard/comment-cell';

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

            <div className="border rounded-lg shadow-sm bg-white overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-gray-100 border-b uppercase text-gray-600 font-semibold">
                        <tr>
                            {/* New ID Column */}
                            <th className="px-3 py-3 w-16">ID</th>
                            {/* Sortable Header: Client Name */}
                            <th className="px-3 py-3">
                                <Link href={getSortLink('client_name')} className="hover:text-blue-600 flex items-center">
                                    Client Info<SortArrow field="client_name" />
                                </Link>
                            </th>
                            {/* Sortable Header: Ticker */}
                            <th className="px-3 py-3">
                                <Link href={getSortLink('ticker')} className="hover:text-blue-600 flex items-center">
                                    Ticker / ISIN <SortArrow field="ticker" />
                                </Link>
                            </th>
                            {/* Sortable Header: Ticker */}
                            <th className="px-3 py-3">
                                <Link href={getSortLink('stock_name')} className="hover:text-blue-600 flex items-center">
                                    Stock Name <SortArrow field="stock_name" />
                                </Link>
                            </th>
                            {/* Sortable Header: Date */}
                            <th className="px-3 py-3">
                                <Link href={getSortLink('date')} className="hover:text-blue-600 flex items-center">
                                    Date <SortArrow field="date" />
                                </Link>
                            </th>
                            <th className="px-3 py-3 text-right">Purchase Qty</th>
                            <th className="px-3 py-3 text-right">Rate</th>
                            <th className="px-3 py-3 text-right">Value</th>
                            <th className="px-3 py-3 text-right">Bal Qty</th>
                            <th className="px-3 py-3 text-right">Mkt Rate</th>
                            <th className="px-3 py-3 text-right">Mkt Value</th>
                            {/* Sortable Header: P/L % */}
                            <th className="px-3 py-3 text-right">
                                <Link href={getSortLink('pl_percent')} className="hover:text-blue-600 flex items-center justify-end">
                                    P/L % <SortArrow field="pl_percent" />
                                </Link>
                            </th>
                            {/* Sortable Header: Total P/L */}
                            <th className="px-3 py-3 text-right">
                                <Link href={getSortLink('pl')} className="hover:text-blue-600 flex items-center justify-end">
                                    Total P/L <SortArrow field="pl" />
                                </Link>
                            </th>
                            {/* Sortable Header: Type (is_long_term) */}
                            <th className="px-3 py-3 text-center">
                                <Link href={getSortLink('is_long_term')} className="hover:text-blue-600 flex items-center justify-center">
                                    Long Term <SortArrow field="is_long_term" />
                                </Link>
                            </th>
                            <th className="px-3 py-3">Comments</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {holdings?.map((row) => (
                            <tr key={row.trx_id} className={`hover:bg-gray-50 ${row.balance_qty === 0 ? 'bg-gray-50/50 opacity-70' : ''}`}>
                                {/* New ID Cell */}
                                <td className="px-3 py-3">
                                    <TrxIdCell id={row.trx_id} />
                                </td>
                                <td className="p-3">
                                    <div className="font-semibold text-gray-900">{row.client_name}</div>
                                    <div className="text-[10px] opacity-70">DP: {row.dp_id} | Trade: {row.trading_id}</div>
                                </td>
                                <td className="px-3 py-3">
                                    <div className="font-bold text-blue-700">{row.ticker}</div>
                                    <div className="text-[10px] text-gray-400">{row.isin}</div>
                                </td>
                                <td className="px-3 py-3 max-w-[120px] truncate">{row.stock_name}</td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                    {new Date(row.date).toLocaleDateString('en-IN')}
                                </td>
                                <td className="px-3 py-3 text-right">{Number(row.purchase_qty)}</td>
                                <td className="px-3 py-3 text-right">₹{Number(row.rate).toFixed(2)}</td>
                                <td className="px-3 py-3 text-right">₹{Number(row.purchase_value).toLocaleString('en-IN')}</td>
                                <td className="px-3 py-3 text-right">{row.balance_qty}</td>
                                <td className="px-3 py-3 text-right text-indigo-600">₹{Number(row.market_rate).toFixed(2)}</td>
                                <td className="px-3 py-3 text-right font-bold">
                                    ₹{Number(row.market_value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className={`px-3 py-3 text-right font-semibold ${row.pl_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {Number(row.pl_percent).toFixed(2)}%
                                </td>
                                <td className={`px-3 py-3 text-right font-bold ${row.pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ₹{Number(row.pl).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-3 py-3 text-center">
                                   <div className="flex justify-center items-center">
                                        <span className={row.is_long_term ? 'text-green-600' : 'text-red-500'}>
                                            {row.is_long_term ? '✓' : '✕'}
                                    </span>
                                    </div>
                                </td>
                               <td className="px-3 py-3">
                                    <CommentCell comment={row.comments} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}