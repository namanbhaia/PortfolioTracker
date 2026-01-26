import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Search, History, Filter, ArrowDownToLine, ArrowUpFromLine, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/transaction-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/transaction-label';
import { searchTransactions } from '@/app/actions/search-transactions';
import { Table } from '@/components/ui/transaction-table';
import Link from 'next/link';
import TrxIdCell from '@/components/dashboard/trx-id-cell';
import CommentCell from '@/components/dashboard/comment-cell';

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
                    <form className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        {/* Inputs: client_name, ticker, start_date, end_date, trx_id */}
                        <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">Client</Label><select name="client_name" defaultValue={resolvedParams.client_name || ''} className="h-10 w-full rounded-md border bg-slate-50 px-3 text-sm">{clients?.map(c => <option key={c.client_name}>{c.client_name}</option>)}</select></div>
                        <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">Ticker</Label><Input name="ticker" placeholder="RELIANCE" defaultValue={resolvedParams.ticker || ''} /></div>
                        <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">From</Label><Input type="date" name="start_date" defaultValue={resolvedParams.start_date || ''} /></div>
                        <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">To</Label><Input type="date" name="end_date" defaultValue={resolvedParams.end_date || ''} /></div>
                        <div className="space-y-1.5"><Label className="text-[11px] font-bold text-slate-500 uppercase">UUID</Label><Input name="trx_id" placeholder="ID" defaultValue={resolvedParams.trx_id || ''} /></div>
                        <div className="md:col-span-5 flex justify-end gap-3 pt-2">
                            <Link href="/dashboard/transactions-lookup" className="text-sm font-semibold text-slate-500 py-2">Clear</Link>
                            <Button type="submit" className="bg-indigo-600 text-white font-bold px-8 rounded-xl">Run Lookup</Button>
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
                            <table className="w-full text-xs text-left border-collapse">
                                <thead className="bg-gray-100 border-b uppercase text-gray-600 font-semibold">
                                    <tr>
                                        {/* New ID Column */}
                                        <th className="px-3 py-3 w-16">ID</th>
                                        <th className="px-3 py-3 w-16">Client Name</th>
                                        <th className="px-4">Ticker / ISIN</th>
                                        <th className="px-4">Stock Name</th>
                                        <th className="px-4">Date</th>
                                        <th className="px-4 text-right">Purchase Qty</th>
                                        <th className="px-4 text-right">Rate</th>
                                        <th className="px-4 text-right">Value</th>
                                        <th className="px-4 text-right">Balance</th>
                                        <th className="px-3 py-3">Comments</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchases.map(row => (
                                        <tr key={row.trx_id} className={`hover:bg-slate-50/50 ${row.is_bold ? 'font-black bg-indigo-50/20' : 'text-slate-400'}`}>
                                            <td className="px-3 py-3">
                                                <TrxIdCell id={row.trx_id} />
                                            </td>
                                            <td className="p-3">
                                                <div className="font-semibold text-gray-900">{row.client_name}</div>
                                                <div className="text-[10px] opacity-70">DP: {row.dp_id} | Trade: {row.trading_id}</div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="text-blue-700">{row.ticker}</div>
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
                                            <td className="px-3 py-3">
                                                <CommentCell comment={row.comments} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* --- SALES TABLE --- */}
                    <div className="space-y-4">
                        <h2 className="text-sm font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2"><ArrowUpFromLine size={16} /> Sale Records</h2>
                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden overflow-x-auto">
                            <Table className="min-w-[1400px]">
                                <thead className="bg-slate-50/50">
                                    <tr className="text-[10px] uppercase font-bold text-slate-500">
                                        <th className="px-4">ID</th>
                                        <th className="px-4">Custom ID</th>
                                        <th className="px-4">Client Info</th>
                                        <th className="px-4">Ticker / ISIN</th>
                                        <th className="px-4">Stock Name</th>
                                        <th className="px-4">Purchase ID</th>
                                        <th className="px-4">Sale Date</th>
                                        <th className="px-4 text-right">Sale Qty</th>
                                        <th className="px-4 text-right">Sale Rate</th>
                                        <th className="px-4 text-right">Sale Value</th>
                                        <th className="px-4 text-center">Long Term</th>
                                        <th className="px-4 text-right">P/L</th>
                                        <th className="px-4 text-right">P/L%</th>
                                        <th className="px-4 text-right">GF. P/L</th>
                                        <th className="px-3 py-3">Comments</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.map(row => {
                                        const plPercent = (Number(row.profit) / (Number(row.purchase_rate) * Number(row.sale_qty))) * 100;
                                        return (
                                            <tr key={row.trx_id} className={`hover:bg-slate-50/50 ${row.is_bold ? 'font-black bg-rose-50/20' : 'text-slate-400'}`}>
                                                <td className="px-3 py-3">
                                                    <TrxIdCell id={row.trx_id} />
                                                </td>
                                                <td className="px-4 py-3 font-mono text-[10px]">{row.custom_id || '--'}</td>
                                                <td className="p-3">
                                                    <div className="font-semibold text-gray-900">{row.client_name}</div>
                                                    <div className="text-[10px] opacity-70">DP: {row.dp_id} | Trade: {row.trading_id}</div>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="text-blue-700">{row.ticker}</div>
                                                    <div className="text-[10px] text-gray-400">{row.isin}</div>
                                                </td>
                                                <td className="px-3 py-3 max-w-[120px] truncate">{row.stock_name}</td>
                                                <td className="px-4 py-3"><TrxIdCell id={row.purchase_trx_id} /></td>
                                                <td className="px-4 py-3 text-xs">{new Date(row.sale_date).toLocaleDateString('en-IN')}</td>
                                                <td className="px-4 py-3 text-right">{Number(row.sale_qty)}</td>
                                                <td className="px-4 py-3 text-right">₹{Number(row.sale_rate).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right text-slate-900">₹{Number(row.sale_value).toLocaleString()}</td>
                                                <td className="px-3 py-3 text-center">
                                                    <div className="flex justify-center items-center">
                                                        <span className={row.is_long_term ? 'text-green-600' : 'text-red-500'}>
                                                            {row.is_long_term ? '✓' : '✕'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className={`px-4 py-3 text-right ${Number(row.pl) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{Number(row.profit).toLocaleString()}</td>
                                                <td className={`px-4 py-3 text-right text-[10px] ${Number(row.pl_percent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{plPercent.toFixed(1)}%</td>
                                                <td className={`px-4 py-3 text-right ${Number(row.adjusted_pl) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{Number(row.profit).toLocaleString()}</td>
                                                <td className="px-3 py-3">
                                                    <CommentCell comment={row.comments} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}