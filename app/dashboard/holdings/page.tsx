import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import HoldingsFilters from '@/components/dashboard/holdings-filters';

// Define the valid sortable columns based on your view
type SortField = 'client_name' | 'ticker' | 'stock_name' | 'date' | 'pl_percent' | 'pl' | 'is_long_term';

export default async function HoldingsPage({
    searchParams,
}: {
    searchParams: Promise<{
        sort?: string;
        order?: string;
        client_ids?: string;
        ticker?: string;
        date_from?: string;
        date_to?: string;
        term?: string;
        positive_balance?: string;
    }>;
}) {
    const supabase = await createClient();
    const params = await searchParams;

    // Default sorting
    const sortField = (params.sort as SortField) || 'date';
    const sortOrder = params.order === 'asc' ? true : false; // false = DESC (default)

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('client_ids')
        .eq('id', user.id)
        .single();

    if (!profile?.client_ids?.length) return <div>No authorized clients.</div>;

    // 3. Fetch data with dynamic sorting and filtering
    let query = supabase
        .from('client_holdings')
        .select('*');

    // Base filter for authorized clients
    let authorizedClientIds = profile.client_ids;

    // Filter by selected client_id(s)
    if (params.client_ids) {
        const selectedClientIds = params.client_ids.split(',');
        // Intersect with authorized clients for security
        authorizedClientIds = selectedClientIds.filter(id => profile.client_ids.includes(id));
    }

    query = query.in('client_id', authorizedClientIds);

    if (params.ticker) {
        query = query.eq('ticker', params.ticker);
    }
    if (params.date_from) {
        query = query.gte('date', params.date_from);
    }
    if (params.date_to) {
        query = query.lte('date', params.date_to);
    }
    if (params.positive_balance === 'true') {
        query = query.gt('balance_qty', 0);
    }
    if (params.term) {
        if (params.term === 'long') {
            query = query.eq('is_long_term', true);
        } else if (params.term === 'short') {
            query = query.eq('is_long_term', false);
        }
    }

    const { data: holdings, error } = await query.order(sortField, { ascending: sortOrder });

    if (error) return <div>Error loading data.</div>;

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
            <HoldingsFilters />

            <div className="border rounded-lg shadow-sm bg-white overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-gray-100 border-b uppercase text-gray-600 font-semibold">
                        <tr>
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
                                    Term <SortArrow field="is_long_term" />
                                </Link>
                            </th>
                            <th className="px-3 py-3">Comments</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {holdings?.map((row) => (
                            <tr key={row.trx_id} className={`hover:bg-gray-50 ${row.balance_qty === 0 ? 'bg-gray-50/50 opacity-70' : ''}`}>
                                <td className="p-3">
                                    <div className="font-semibold text-gray-900">{row.client_name}</div>
                                    <div className="text-[10px] opacity-70">DP: {row.dp_id} | Trade: {row.trading_id}</div>
                                </td>
                                <td className="px-3 py-3">
                                    <div className="font-bold text-blue-700">{row.ticker}</div>
                                    <div className="text-[10px] text-gray-400">{row.isin}</div>
                                </td>
                                <td className="px-3 py-3 max-w-[150px] truncate">{row.stock_name}</td>
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
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.is_long_term ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {row.is_long_term ? 'LONG' : 'SHORT'}
                                    </span>
                                </td>
                                <td className="px-3 py-3 text-gray-500 italic max-w-[200px] truncate" title={row.comments}>
                                    {row.comments || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}