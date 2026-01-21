import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { searchTransactions } from '@/app/actions/search-transactions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let purchases: Purchase[] = [];
  let sales: Sale[] = [];
  let searchError: string | null = null;

  const hasSearchParams = Object.keys(searchParams).some(key => searchParams[key]);


  if (hasSearchParams) {
    const formData = new FormData();
    for (const key in searchParams) {
      const value = searchParams[key];
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
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Transaction Search</h1>
      <Card>
        <CardHeader>
          <CardTitle>Filter Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name</Label>
              <Input id="client_name" name="client_name" placeholder="e.g., John Doe" defaultValue={searchParams.client_name as string ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker</Label>
              <Input id="ticker" name="ticker" placeholder="e.g., AAPL" defaultValue={searchParams.ticker as string ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" name="date" type="date" defaultValue={searchParams.date as string ?? ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trx_id">Transaction ID</Label>
              <Input id="trx_id" name="trx_id" placeholder="e.g., 12345" defaultValue={searchParams.trx_id as string ?? ''} />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit">Search</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {searchError && (
        <Card>
            <CardContent className="p-4 text-red-500 bg-red-50 rounded-lg">
                {searchError}
            </CardContent>
        </Card>
      )}

      {/* Results Section */}
      <div className="space-y-4">
        {!searchError && (
          <>
            <Card>
              <CardHeader>
              <CardTitle>Purchase Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {purchases.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((p) => (
                      <TableRow key={p.trx_id}>
                        <TableCell>{p.client_name}</TableCell>
                        <TableCell>{p.ticker}</TableCell>
                        <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                        <TableCell>{p.qty}</TableCell>
                        <TableCell>{p.rate}</TableCell>
                        <TableCell>{p.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <p>No purchase transactions found.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Sale Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {sales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Ticker</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((s) => (
                      <TableRow key={s.trx_id}>
                        <TableCell>{s.client_name}</TableCell>
                        <TableCell>{s.ticker}</TableCell>
                        <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
                        <TableCell>{s.qty}</TableCell>
                        <TableCell>{s.rate}</TableCell>
                        <TableCell>{s.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : <p>No sale transactions found.</p>}
            </CardContent>
          </Card>
        </>
        )}
      </div>
    </div>
  );
}