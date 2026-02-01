import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Search, History, Filter, ArrowDownToLine, ArrowUpFromLine, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/transaction-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/transaction-label';
import { searchTransactions } from '@/app/actions/search-transactions';
import { Table, TableBody, TableFooter, TableHeader, TableRow, TableHead, TableCell, TableCaption } from '@/components/ui/transaction-table';
import Link from 'next/link';
import TrxIdCell from '@/components/ui/trx-id-cell';
import CommentCell from '@/components/ui/comment-cell';
import EditTransactionSimple from '@/components/ui/edit-transaction-sheet'; 

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<any> }) {
    const resolvedParams = await searchParams;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: clients } = await supabase.from('clients').select('client_name').order('client_name');

    let purchases: any[] = [];
    let sales: any[] = [];
    let searchError: string | null = null;

    const hasParams = Object.keys(resolvedParams).some(k => resolvedParams[k]);
    if (hasParams) {
        const formData = new FormData();
        Object.entries(resolvedParams).forEach(([k, v]) => v && formData.append(k, String(v)));
        const result = await searchTransactions(formData);
        if (result.error) searchError = result.error;
        else { purchases = result.purchases || []; sales = result.sales || []; }
    }

    return (
        <div className="p-8 max-w-[1650px] mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Audit Lookup</h1>
                    <p className="text-slate-500 mt-1">Search buy/sell logs with relational impact tracing.</p>
                </div>
            </header>

            {/* Filter Section (Keep your existing Filter Card UI here) */}
            <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                    <form className="flex flex-col gap-8">
                        
                        {/* 1. PRIMARY SEARCH: UUID (Top Row) */}
                        <div className="max-w-md space-y-2">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Direct UUID Lookup</Label>
                            <div className="relative group">
                                <div className="absolute left-3 top-2.5 text-indigo-400">
                                    <Search size={18} />
                                </div>
                                <Input 
                                    name="trx_id" 
                                    placeholder="Paste Transaction / Search UUID..." 
                                    defaultValue={resolvedParams.trx_id || ''} 
                                    className="pl-10 h-11 border-indigo-100 bg-indigo-50/30 focus:bg-white focus:ring-indigo-500 focus:border-indigo-500 transition-all rounded-xl shadow-sm"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 ml-1 italic">UUID search ignores all filters in the box below.</p>
                        </div>

                        {/* 2. SECONDARY FILTERS: Single Row Box Boundary */}
                        <div className="space-y-3">
                            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Filter Results</Label>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-inner">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Client</Label>
                                    <select 
                                        name="client_name" 
                                        defaultValue="" 
                                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    >
                                        <option value="">All Clients</option> 
                                        {clients?.map(c => (
                                            <option key={c.client_name} value={c.client_name}>{c.client_name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">Ticker</Label>
                                    <Input name="ticker" placeholder="RELIANCE" defaultValue={resolvedParams.ticker || ''} className="bg-white h-10 border-slate-200 focus:border-indigo-300" />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">From Date</Label>
                                    <Input type="date" name="start_date" defaultValue={resolvedParams.start_date || ''} className="bg-white h-10 border-slate-200" />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-slate-400 uppercase">To Date</Label>
                                    <Input type="date" name="end_date" defaultValue={resolvedParams.end_date || ''} className="bg-white h-10 border-slate-200" />
                                </div>
                            </div>
                        </div>

                        {/* 3. ACTIONS */}
                        <div className="flex justify-end items-center gap-4 pt-2 border-t border-slate-50">
                            <Link 
                                href="/dashboard/transactions-lookup" 
                                className="text-sm font-semibold text-slate-400 hover:text-rose-500 transition-colors"
                            >
                                Reset Fields
                            </Link>
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-12 h-11 rounded-xl shadow-lg shadow-indigo-100/50 transition-all active:scale-[0.98]">
                                Run Search
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

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
                                        <TableHead className="w-10 px-2"></TableHead> {/* 1. NEW HEADER */}
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
                                            <TableCell className="px-3 py-3">
                                                <div className="text-blue-700">{row.ticker}</div>
                                                <div className="text-[10px] text-gray-400">{row.isin}</div>
                                            </TableCell>
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
                                            <TableCell className="px-2"> {/* 2. NEW CELL */}
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
                                        <TableHead className="w-10 px-2"></TableHead> {/* 3. NEW HEADER */}
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
                                                <TableCell className="px-3 py-3">
                                                    <div className="text-blue-700">{row.ticker}</div>
                                                    <div className="text-[10px] text-gray-400">{row.isin}</div>
                                                </TableCell>
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
                                                <TableCell className={`px-4 py-3 text-right ${Number(row.pl) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{Number(row.profit).toLocaleString()}</TableCell>
                                                <TableCell className={`px-4 py-3 text-right text-[10px] ${Number(row.pl_percent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{plPercent.toFixed(1)}%</TableCell>
                                                <TableCell className={`px-4 py-3 text-right ${Number(row.adjusted_pl) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{Number(row.profit).toLocaleString()}</TableCell>
                                                <TableCell className="px-3 py-3">
                                                    <CommentCell comment={row.comments} />
                                                </TableCell>
                                                <TableCell className="px-2"> {/* 4. NEW CELL */}
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