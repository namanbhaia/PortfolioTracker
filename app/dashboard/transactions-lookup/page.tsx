import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Search, ArrowDownToLine, ArrowUpFromLine, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/transaction-input';
import { searchTransactions } from '@/lib/actions/search-transactions';
import { Table, TableBody, TableHeader, TableRow, TableHead, TableCell } from '@/components/ui/transaction-table';
import TrxIdCell from '@/components/ui/trx-id-cell';
import CommentCell from '@/components/ui/comment-cell';
import TickerCell from '@/components/ui/ticker-cell';
import EditTransactionSimple from '@/components/ui/edit-transaction-sheet';
import HoldingsFilter from '@/components/ui/holdings-filters'; // Import the new filter [cite: holdings-filters.tsx]

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<any> }) {
    const resolvedParams = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // 1. Fetch client_id + client_name for the filter [cite: holdings-filters.tsx]
    const { data: clients } = await supabase.from('clients').select('client_id, client_name').order('client_name');

    let purchases: any[] = [];
    let sales: any[] = [];
    let searchError: string | null = null;

    const hasParams = Object.keys(resolvedParams).some(k => resolvedParams[k]);
    if (hasParams) {
        const formData = new FormData();

        // 2. Map 'client_ids' from filter URL to 'client_name' for searchTransactions backend
        if (resolvedParams.client_ids && clients) {
            const ids = resolvedParams.client_ids.split(',');
            const names = clients
                .filter(c => ids.includes(c.client_id))
                .map(c => c.client_name);

            // Append names so the existing search action finds them
            names.forEach(n => formData.append('client_name', n));
        }

        // Pass standard filters directly
        ['trx_id', 'ticker', 'start_date', 'end_date'].forEach(k => {
            if (resolvedParams[k]) formData.append(k, resolvedParams[k]);
        });

        const result = await searchTransactions(formData);
        if (result.error) searchError = result.error;
        else { purchases = result.purchases || []; sales = result.sales || []; }
    }

    return (
        <div className="p-8 mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Audit Lookup</h1>
                    <p className="text-slate-500 mt-1">Search buy/sell logs with relational impact tracing.</p>
                </div>
            </header>

            {/* 3. NEW FILTER SECTION (Row Layout) */}
            <div className="flex flex-col xl:flex-row items-center gap-4 w-full">

                {/* Left: The Main Filtering Bar (Flexible Width) */}
                <div className="flex-grow w-full xl:w-auto">
                    <HoldingsFilter
                        availableClients={clients || []}
                        showLongTermToggle={false}
                        showBalanceToggle={false}
                    />
                </div>

                {/* Middle: Separator */}
                <div className="text-slate-300 font-bold text-xs uppercase shrink-0">OR</div>

                {/* Right: Direct UUID Lookup (Fixed Width) */}
                <div className="w-full md:w-96 shrink-0">
                    <form className="relative w-full">
                        <Input
                            name="trx_id"
                            placeholder="Direct UUID Lookup..."
                            defaultValue={resolvedParams.trx_id || ''}
                            className="pr-10 pl-4 bg-white border-slate-200 shadow-sm rounded-xl h-[58px]" // Matches height of filter bar
                        />
                        <button
                            type="submit"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-2"
                        >
                            <Search size={18} />
                        </button>
                    </form>
                </div>
            </div>

            {searchError && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center gap-3">
                    <AlertCircle className="text-rose-600" size={20} /> {searchError}
                </div>
            )}

            {!searchError && hasParams && (
                <div className="space-y-12">
                    {/* --- PURCHASE TABLE --- */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2"><ArrowDownToLine size={16} /> Purchase Records</h2>
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            <Table className="w-full text-xs text-left border-collapse">
                                <TableHeader className="bg-gray-100 border-b uppercase text-gray-600 font-semibold">
                                    <TableRow>
                                        <TableHead className="px-3 py-3 w-16">ID</TableHead>
                                        <TableHead className="px-3 py-3 w-16">Client Name</TableHead>
                                        <TableHead className="px-4">Ticker / ISIN</TableHead>
                                        <TableHead className="px-4">Stock Name</TableHead>
                                        <TableHead className="px-4">Date</TableHead>
                                        <TableHead className="px-4 text-right">Purchase Qty</TableHead>
                                        <TableHead className="px-4 text-right">Rate</TableHead>
                                        <TableHead className="px-4 text-right">Value</TableHead>
                                        <TableHead className="px-4 text-right">Balance</TableHead>
                                        <TableHead className="px-3 py-3">Comments</TableHead>
                                        <TableHead className="w-10 px-2"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchases.map(row => (
                                        <TableRow key={row.trx_id} className={`hover:bg-slate-50/50 ${row.is_bold ? 'font-black bg-indigo-50/20' : 'text-slate-400'}`}>
                                            <TableCell className="px-3 py-3">
                                                <TrxIdCell id={row.trx_id} />
                                            </TableCell>
                                            <TableCell className="p-3">
                                                <div className="font-semibold text-gray-900">{row.client_name}</div>
                                                <div className="text-[10px] opacity-70">DP: {row.dp_id} | Trade: {row.trading_id}</div>
                                            </TableCell>
                                            <TickerCell ticker={row.ticker} isin={row.isin} />
                                            <TableCell className="px-3 py-3 max-w-[120px] truncate">{row.stock_name}</TableCell>
                                            <TableCell className="px-3 py-3 whitespace-nowrap">
                                                {new Date(row.date).toLocaleDateString('en-IN')}
                                            </TableCell>
                                            <TableCell className="px-3 py-3 text-right">{Number(row.purchase_qty)}</TableCell>
                                            <TableCell className="px-3 py-3 text-right">₹{Number(row.rate).toFixed(2)}</TableCell>
                                            <TableCell className="px-3 py-3 text-right">₹{Number(row.purchase_value).toLocaleString('en-IN')}</TableCell>
                                            <TableCell className="px-3 py-3 text-right">{row.balance_qty}</TableCell>
                                            <TableCell className="px-3 py-3">
                                                <CommentCell comment={row.comments} />
                                            </TableCell>
                                            <TableCell className="px-2">
                                                <EditTransactionSimple row={row} type="purchase" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* --- SALES TABLE --- */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2"><ArrowUpFromLine size={16} /> Sale Records</h2>
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden overflow-x-auto">
                            <Table className="min-w-[1400px]">
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="text-[10px] uppercase font-bold text-slate-500">
                                        <TableHead className="px-4">ID</TableHead>
                                        <TableHead className="px-4">Custom ID</TableHead>
                                        <TableHead className="px-4">Client Info</TableHead>
                                        <TableHead className="px-4">Ticker / ISIN</TableHead>
                                        <TableHead className="px-4">Stock Name</TableHead>
                                        <TableHead className="px-4">Purchase ID</TableHead>
                                        <TableHead className="px-4">Sale Date</TableHead>
                                        <TableHead className="px-4 text-right">Sale Qty</TableHead>
                                        <TableHead className="px-4 text-right">Sale Rate</TableHead>
                                        <TableHead className="px-4 text-right">Sale Value</TableHead>
                                        <TableHead className="px-4 text-center">Long Term</TableHead>
                                        <TableHead className="px-4 text-right">P/L</TableHead>
                                        <TableHead className="px-4 text-right">P/L%</TableHead>
                                        <TableHead className="px-4 text-right">GF. P/L</TableHead>
                                        <TableHead className="px-3 py-3">Comments</TableHead>
                                        <TableHead className="w-10 px-2"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sales.map(row => {
                                        const plPercent = (Number(row.profit) / (Number(row.purchase_rate) * Number(row.sale_qty))) * 100;
                                        return (
                                            <TableRow key={row.trx_id} className={`hover:bg-slate-50/50 ${row.is_bold ? 'font-black bg-rose-50/20' : 'text-slate-400'}`}>
                                                <TableCell className="px-3 py-3">
                                                    <TrxIdCell id={row.trx_id} />
                                                </TableCell>
                                                <TableCell className="px-4 py-3 font-mono text-[10px]">{row.custom_id || '--'}</TableCell>
                                                <TableCell className="p-3">
                                                    <div className="font-semibold text-gray-900">{row.client_name}</div>
                                                    <div className="text-[10px] opacity-70">DP: {row.dp_id} | Trade: {row.trading_id}</div>
                                                </TableCell>
                                                <TickerCell ticker={row.ticker} isin={row.isin} />
                                                <TableCell className="px-3 py-3 max-w-[120px] truncate">{row.stock_name}</TableCell>
                                                <TableCell className="px-4 py-3"><TrxIdCell id={row.purchase_trx_id} /></TableCell>
                                                <TableCell className="px-4 py-3 text-xs">{new Date(row.sale_date).toLocaleDateString('en-IN')}</TableCell>
                                                <TableCell className="px-4 py-3 text-right">{Number(row.sale_qty)}</TableCell>
                                                <TableCell className="px-4 py-3 text-right">₹{Number(row.sale_rate).toLocaleString()}</TableCell>
                                                <TableCell className="px-4 py-3 text-right text-slate-900">₹{Number(row.sale_value).toLocaleString()}</TableCell>
                                                <TableCell className="px-3 py-3 text-center">
                                                    <div className="flex justify-center items-center">
                                                        <span className={row.long_term ? 'text-green-600' : 'text-red-500'}>
                                                            {row.long_term ? '✓' : '✕'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className={`px-4 py-3 text-right ${Number(row.pl) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{Number(row.pl).toLocaleString()}</TableCell>
                                                <TableCell className={`px-4 py-3 text-right text-[10px] ${Number(row.pl_percentage) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{row.pl_percentage.toFixed(1)}%</TableCell>
                                                <TableCell className={`px-4 py-3 text-right ${Number(row.adjusted_pl) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{Number(row.adjusted_pl).toLocaleString()}</TableCell>
                                                <TableCell className="px-3 py-3">
                                                    <CommentCell comment={row.comments} />
                                                </TableCell>
                                                <TableCell className="px-2">
                                                    <EditTransactionSimple row={row} type="sale" />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}