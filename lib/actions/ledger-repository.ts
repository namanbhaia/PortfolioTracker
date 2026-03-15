import { SupabaseClient } from '@supabase/supabase-js';
import { getGrandfatheredRate } from '@/components/helper/utility';

export class LedgerRepository {
  constructor(private supabase: SupabaseClient) {}

  async fetchSalesByDate(clientName: string, ticker: string, fromDate: string | Date) {
    const { data, error } = await this.supabase
      .from('sales')
      .select('*, purchases!inner(date, ticker, created_at)')
      .eq('client_name', clientName)
      .eq('purchases.ticker', ticker)
      .gte('date', fromDate)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Fetch Sales Failed: ${error.message}`);
    return data || [];
  }

  async fetchPurchasesByDate(clientName: string, ticker: string, fromDate: string | Date) {
    const { data, error } = await this.supabase
      .from('purchases')
      .select('*')
      .eq('client_name', clientName)
      .eq('ticker', ticker)
      .gte('date', fromDate)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Fetch Purchases Failed: ${error.message}`);
    return data || [];
  }

  async fetchSalesByIds(clientName: string, saleIds: string[]) {
    const { data, error } = await this.supabase
      .from('sales')
      .select('*, purchases!inner(date, ticker)')
      .eq('client_name', clientName)
      .in('trx_id', saleIds)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Fetch Sales Failed: ${error.message}`);
    return data || [];
  }

  async fetchPurchaseById(trx_id: string) {
    const { data, error } = await this.supabase
      .from('purchases')
      .select('*')
      .eq('trx_id', trx_id)
      .single();

    if (error) throw new Error(`Purchase record not found: ${error.message}`);
    return data;
  }

  async fetchSalesByTrxIds(saleIds: string[]) {
    const { data, error } = await this.supabase
      .from('sales')
      .select('*')
      .in('trx_id', saleIds);

    if (error) throw new Error(`Fetch Sales Failed: ${error.message}`);
    return data || [];
  }

  async fetchSalesByCustomIdWithPurchase(custom_id: string) {
    const { data, error } = await this.supabase
      .from('sales')
      .select('*, purchases(rate, date, ticker)')
      .eq('custom_id', custom_id);

    if (error) throw new Error(`Fetch Sales Failed: ${error.message}`);
    return data || [];
  }

  async fetchSalesByCustomId(custom_id: string) {
    const { data, error } = await this.supabase
      .from('sales')
      .select('*')
      .eq('custom_id', custom_id);

    if (error) throw new Error(`Fetch Sales Failed: ${error.message}`);
    return data || [];
  }

  async fetchSingleSaleByCustomId(custom_id: string) {
    const { data, error } = await this.supabase
      .from('sales')
      .select('*')
      .eq('custom_id', custom_id)
      .limit(1)
      .single();

    if (error || !data) throw new Error(`Sale not found: ${error?.message || ''}`);
    return data;
  }

  async fetchHoldingsBalances(clientName: string, ticker: string) {
    const { data, error } = await this.supabase
      .from('purchases')
      .select('balance_qty')
      .eq('client_name', clientName)
      .eq('ticker', ticker)
      .gt('balance_qty', 0);

    if (error) throw new Error(`Failed to validate cumulative balance: ${error.message}`);
    return data || [];
  }

  async atomicLedgerUpdate(payload: any) {
    const { error } = await this.supabase.rpc('atomic_ledger_update', { payload });
    if (error) throw new Error(`Atomic Update Failed: ${error.message}`);
  }

  async getGrandfatheredRate(ticker: string): Promise<number | null> {
    return await getGrandfatheredRate(this.supabase, ticker);
  }
}
