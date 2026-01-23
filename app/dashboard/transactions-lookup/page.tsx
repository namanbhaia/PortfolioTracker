import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Search, History, Filter, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/transaction-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/transaction-label';
import { searchTransactions } from '@/app/actions/search-transactions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/transaction-table';

// Define types for better type safety
type Purchase = {
    trx_id: string;
    client_name: string;
    ticker: string;
    date: string;
    qty: number;
    rate: number;
    value: number;
};

type Sale = {
    trx_id: string;
    client_name: string;
    ticker: string;
    date: string;
    qty: number;
    rate: number;
    value: number;
};

export default async function TransactionsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedSearchParams = await searchParams;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    let purchases: Purchase[] = [];
    let sales: Sale[] = [];
    let searchError: string | null = null;

    const hasSearchParams = Object.keys(resolvedSearchParams).some(key => resolvedSearchParams[key]);

    if (hasSearchParams) {
        const formData = new FormData();
        for (const key in resolvedSearchParams) {
            const value = resolvedSearchParams[key];
            if (typeof value === 'string' && value) {
                formData.append(key, value);
            }
        }
        const result = await searchTransactions(formData);
        if (result.error) {
            searchError = result.error;
        } else {
            purchases = result.purchases || [];
            sales = result.sales || [];
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header synced with Holdings/Sales pages */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Transaction Lookup</h1>
                    <p className="text-slate-500 mt-1">Audit and search historical buy/sell logs across all clients.</p>
                </div>
                <div className="bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium text-indigo-600 flex items-center gap-2">
                    <History size={16} />
                    <span>Historical Audit</span>
                </div>
            </header>

            {/* Filter Card with app-standard labeling */}
            <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Filter size={14} />
                        Filter Transactions
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <form className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <Label htmlFor="client_name" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Client Name</Label>
                            <Input id="client_name" name="client_name" placeholder="Search accounts..." defaultValue={resolvedSearchParams.client_name as string ?? ''} className="bg-slate-50 border-slate-200" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="ticker" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ticker</Label>
                            <Input id="ticker" name="ticker" placeholder="e.g. RELIANCE" defaultValue={resolvedSearchParams.ticker as string ?? ''} className="bg-slate-50 border-slate-200 uppercase font-bold" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="date" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transaction Date</Label>
                            <Input id="date" name="date" type="date" defaultValue={resolvedSearchParams.date as string ?? ''} className="bg-slate-50 border-slate-200" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="trx_id" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transaction ID</Label>
                            <Input id="trx_id" name="trx_id" placeholder="UUID search..." defaultValue={resolvedSearchParams.trx_id as string ?? ''} className="bg-slate-50 border-slate-200 font-mono text-xs" />
                        </div>
                        <div className="md:col-span-4 flex justify-end">
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2">
                                <Search size={18} />
                                Run Lookup
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {searchError && (
                <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-sm font-medium flex items-center gap-2">
                    <span className="h-2 w-2 bg-rose-500 rounded-full animate-pulse" />
                    {searchError}
                </div>
            )}

            {/* Results Section synced with table styling */}
            <div className="space-y-8">
                {!searchError && hasSearchParams && (
                    <>
                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                <ArrowDownToLine size={16} /> Purchase Records
                            </h2>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                {purchases.length > 0 ? (
                                    <Table>
                                        <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                                            <TableRow>
                                                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Client</TableHead>
                                                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ticker</TableHead>
                                                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</TableHead>
                                                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Quantity</TableHead>
                                                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Rate</TableHead>
                                                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Value</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-slate-100">
                                            {purchases.map((p) => (
                                                <TableRow key={p.trx_id} className="hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="px-6 py-4 font-bold text-slate-900">{p.client_name}</TableCell>
                                                    <TableCell className="px-6 py-4 font-mono font-bold text-indigo-600 uppercase">{p.ticker}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-500">{new Date(p.date).toLocaleDateString('en-IN')}</TableCell>
                                                    <TableCell className="px-6 py-4 text-right font-mono font-medium">{p.qty}</TableCell>
                                                    <TableCell className="px-6 py-4 text-right font-mono text-slate-600">₹{(p.rate ?? 0).toLocaleString('en-IN')}</TableCell>
                                                    <TableCell className="px-6 py-4 text-right font-bold text-slate-900">₹{(p.value ?? (p.qty * p.rate) ?? 0).toLocaleString('en-IN')}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : <div className="p-12 text-center text-slate-400 italic">No purchase records found.</div>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-sm font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                <ArrowUpFromLine size={16} /> Sale Records
                            </h2>
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                {sales.length > 0 ? (
                                    <Table>
                                        <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                                            <TableRow>
                                                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Client</TableHead>
                                                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ticker</TableHead>
                                                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</TableHead>
                                                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Quantity</TableHead>
                                                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Rate</TableHead>
                                                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Value</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-slate-100">
                                            {sales.map((s) => (
                                                <TableRow key={s.trx_id} className="hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="px-6 py-4 font-bold text-slate-900">{s.client_name}</TableCell>
                                                    <TableCell className="px-6 py-4 font-mono font-bold text-rose-600 uppercase">{s.ticker}</TableCell>
                                                    <TableCell className="px-6 py-4 text-slate-500">{new Date(s.date).toLocaleDateString('en-IN')}</TableCell>
                                                    <TableCell className="px-6 py-4 text-right font-mono font-medium">{s.qty}</TableCell>
                                                    <TableCell className="px-6 py-4 text-right font-mono text-slate-600">₹{(s.rate ?? 0).toLocaleString('en-IN')}</TableCell>
                                                    <TableCell className="px-6 py-4 text-right font-bold text-slate-900">₹{(s.value ?? (s.qty * s.rate) ?? 0).toLocaleString('en-IN')}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : <div className="p-12 text-center text-slate-400 italic">No sale records found.</div>}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}