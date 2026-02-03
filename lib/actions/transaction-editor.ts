import { SupabaseClient } from '@supabase/supabase-js';
import { isLongTerm } from '@/components/helper/utility';

// ==========================================
// 1. Interfaces
// ==========================================

export interface Purchase {
  trx_id: string;
  user_id: string;
  client_name: string;
  ticker: string;
  date: string;
  rate: number;
  purchase_qty: number; 
  comments: string;
  sale_ids: string[];
  client_id: string;
  balance_qty: number;
}

export interface Sale {
  trx_id: string;
  custom_id: string;
  purchase_trx_id: string | null;
  client_name: string;
  ticker: string;
  date: string;
  sale_qty: number;
  rate: number;
  user_id: string;
  profit_stored: number;
  comments: string;
  long_term: boolean;
  client_id: string;
  adjusted_profit_stored: number;
}

export interface SaleIntent {
  trx_id?: string;
  custom_id: string; 
  purchase_trx_id: string | null;
  client_name: string;
  ticker: string;
  date: string;
  sale_qty: number;
  rate: number;
  user_id: string;
  profit_stored: number;
  comments: string;
  long_term: boolean;
  client_id: string;
  adjusted_profit_stored: number;
}

// ==========================================
// 2. Utility Class
// ==========================================

export class TransactionEditor {
  constructor(private supabase: SupabaseClient) {}

  private generateUUID(): string {
    return crypto.randomUUID();
  }

  private async reprocessLedger(
    clientName: string,
    ticker: string,
    impactDate: string,
    overrides?: Map<string, SaleIntent>
  ) {
    // ---------------------------------------------------------
    // A. FETCH DATA
    // ---------------------------------------------------------
    
    // FETCH PURCHASES
    const { data: rawPurchases, error: pError } = await this.supabase
      .from('purchases')
      .select('*, clients(client_id)') // Use Left Join to be safe
      .eq('client_name', clientName)
      .eq('ticker', ticker)
      .or(`date.gte.${impactDate},balance_qty.gt.0`)
      .order('date', { ascending: true });

    if (pError) throw new Error(`Fetch Purchases Failed: ${pError.message}`);

    // FETCH SALES
    // FIX: Join purchases!inner to filter by ticker and get client_id via purchase path
    const { data: rawSales, error: sError } = await this.supabase
      .from('sales')
      .select('*, purchases!inner(date, ticker, clients(client_id))') 
      .eq('client_name', clientName)
      .eq('purchases.ticker', ticker) // Filter via the joined table
      .gte('date', impactDate)
      .order('date', { ascending: true });

    if (sError) throw new Error(`Fetch Sales Failed: ${sError.message}`);

    // ---------------------------------------------------------
    // B. MAP DB TO INTERFACES
    // ---------------------------------------------------------

    let purchases: Purchase[] = (rawPurchases || []).map((p: any) => ({
      ...p,
      client_id: p.client_id || p.clients?.client_id,
      sale_ids: p.sale_ids || [],
      balance_qty: Number(p.balance_qty)
    }));

    const salesRows: Sale[] = (rawSales || []).map((s: any) => ({
      ...s,
      // FIX: Access nested client_id via purchase if direct link is missing
      client_id: s.client_id || s.purchases?.clients?.client_id,
      // FIX: Map ticker from purchase
      ticker: s.purchases?.ticker || ticker,
      long_term: s.purchases?.date ? isLongTerm(s.purchases.date, s.date) : false
    }));

    // ---------------------------------------------------------
    // C. UNLINK STEP
    // ---------------------------------------------------------
    
    const customIdsToReprocess = new Set<string>();
    
    salesRows.forEach(s => customIdsToReprocess.add(s.custom_id));
    if (overrides) {
        for (const cid of overrides.keys()) customIdsToReprocess.add(cid);
    }

    const salesTrxIdsToUnlink = new Set(
        salesRows.filter(s => customIdsToReprocess.has(s.custom_id)).map(s => s.trx_id)
    );

    purchases = purchases.map(p => {
      const currentSaleIds = p.sale_ids || [];
      const validSaleIds = currentSaleIds.filter(id => !salesTrxIdsToUnlink.has(id));

      const restoredQty = salesRows
        .filter(s => s.purchase_trx_id === p.trx_id && salesTrxIdsToUnlink.has(s.trx_id))
        .reduce((sum, s) => sum + s.sale_qty, 0);

      return {
        ...p,
        sale_ids: validSaleIds,
        balance_qty: p.balance_qty + restoredQty
      };
    });

    // ---------------------------------------------------------
    // D. AGGREGATE STEP
    // ---------------------------------------------------------
    const salesOrdersMap = new Map<string, SaleIntent>();

    salesRows.forEach(split => {
      if (overrides?.has(split.custom_id)) return;

      if (!salesOrdersMap.has(split.custom_id)) {
        salesOrdersMap.set(split.custom_id, {
          ...split,
          sale_qty: 0, 
          profit_stored: 0, 
          adjusted_profit_stored: 0 
        });
      }
      const order = salesOrdersMap.get(split.custom_id)!;
      order.sale_qty += split.sale_qty;
    });

    if (overrides) {
        for (const [cid, intent] of overrides.entries()) {
            salesOrdersMap.set(cid, intent);
        }
    }

    const sortedOrders = Array.from(salesOrdersMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // ---------------------------------------------------------
    // E. REMAP STEP (FIFO Execution)
    // ---------------------------------------------------------
    const salesToInsert: Sale[] = [];
    const purchasesToUpdate = new Map<string, Purchase>(); 

    for (const order of sortedOrders) {
      let qtyRemaining = order.sale_qty;

      const eligiblePurchases = purchases.filter(p => 
        (p.balance_qty > 0) && (new Date(p.date) <= new Date(order.date))
      );

      const totalAvailable = eligiblePurchases.reduce((sum, p) => sum + p.balance_qty, 0);
      if (totalAvailable < qtyRemaining) {
         throw new Error(`Insufficient balance for Sale ${order.custom_id}. Needed ${qtyRemaining}, Found ${totalAvailable}`);
      }

      for (const p of eligiblePurchases) {
        if (qtyRemaining <= 0) break;

        const take = Math.min(p.balance_qty, qtyRemaining);
        
        p.balance_qty -= take;
        
        const newSplitId = this.generateUUID();
        p.sale_ids.push(newSplitId);
        
        purchasesToUpdate.set(p.trx_id, { ...p });

        const profit = (order.rate - p.rate) * take;
        const isLT = isLongTerm(p.date, order.date);

        salesToInsert.push({
          trx_id: newSplitId,
          custom_id: order.custom_id,
          purchase_trx_id: p.trx_id,
          client_name: order.client_name,
          ticker: order.ticker,
          date: order.date,
          sale_qty: take,
          rate: order.rate,
          profit_stored: profit,
          adjusted_profit_stored: profit, 
          user_id: order.user_id,
          comments: order.comments,
          long_term: isLT,
          client_id: order.client_id
        });

        qtyRemaining -= take;
      }
    }

    // ---------------------------------------------------------
    // F. COMMIT
    // ---------------------------------------------------------
    const payload = {
      sales_to_delete: Array.from(customIdsToReprocess),
      purchases_to_update: Array.from(purchasesToUpdate.values()),
      sales_to_insert: salesToInsert
    };

    const { error } = await this.supabase.rpc('atomic_ledger_update', { payload });
    if (error) throw new Error(`Atomic Update Failed: ${error.message}`);
  }


  // ==========================================
  // 3. Entry Points
  // ==========================================

  async editPurchaseRate(trx_id: string, newRate: number) {
    const { error } = await this.supabase
      .from('purchases')
      .update({ rate: newRate })
      .eq('trx_id', trx_id);
    
    if (error) throw error;

    const { data: linkedSales } = await this.supabase
      .from('sales')
      .select('*')
      .eq('purchase_trx_id', trx_id);

    if (linkedSales && linkedSales.length > 0) {
      for (const sale of linkedSales) {
        // Recalculate based on new base rate
        const newProfit = (sale.rate - newRate) * sale.sale_qty; 
        await this.supabase
          .from('sales')
          .update({ 
            profit_stored: newProfit, 
            adjusted_profit_stored: newProfit 
          })
          .eq('trx_id', sale.trx_id);
      }
    }
  }

  async editSaleRate(custom_id: string, newRate: number) {
    const { data: splits } = await this.supabase
      .from('sales')
      .select('*, purchases(rate)')
      .eq('custom_id', custom_id);
    
    if (!splits) return;

    for (const split of splits) {
      const purchaseRate = split.purchases.rate;
      const newProfit = (newRate - purchaseRate) * split.sale_qty;
      
      await this.supabase
        .from('sales')
        .update({ 
          rate: newRate, 
          profit_stored: newProfit, 
          adjusted_profit_stored: newProfit 
        })
        .eq('trx_id', split.trx_id);
    }
  }

  async editSaleDate(custom_id: string, newDate: string, originalDate: string, clientName: string, ticker: string) {
    // FIX: Route through purchases to get client_id if needed
    const { data: existing } = await this.supabase
        .from('sales')
        .select('*, purchases!inner(clients(client_id))')
        .eq('custom_id', custom_id)
        .limit(1)
        .single();
    
    if(!existing) throw new Error("Sale not found");

    const { data: allSplits } = await this.supabase.from('sales').select('sale_qty').eq('custom_id', custom_id);
    const totalQty = allSplits?.reduce((acc, s) => acc + s.sale_qty, 0) || 0;

    const intent: SaleIntent = {
        custom_id: custom_id,
        purchase_trx_id: null,
        client_name: clientName,
        ticker: ticker,
        date: newDate, 
        sale_qty: totalQty,
        rate: existing.rate,
        user_id: existing.user_id,
        profit_stored: 0,
        comments: existing.comments,
        long_term: false, 
        // FIX: Access nested client_id
        client_id: existing.client_id || existing.purchases?.clients?.client_id,
        adjusted_profit_stored: 0
    };

    const overrides = new Map<string, SaleIntent>();
    overrides.set(custom_id, intent);

    const impactDate = new Date(newDate) < new Date(originalDate) ? newDate : originalDate;
    await this.reprocessLedger(clientName, ticker, impactDate, overrides);
  }

  async editPurchaseDate(trx_id: string, newDate: string, originalDate: string, clientName: string, ticker: string) {
    await this.supabase.from('purchases').update({ date: newDate }).eq('trx_id', trx_id);

    const impactDate = new Date(newDate) < new Date(originalDate) ? newDate : originalDate;
    await this.reprocessLedger(clientName, ticker, impactDate);
  }

  async editPurchaseQty(trx_id: string, newQty: number, clientName: string, ticker: string, originalDate: string) {
    // 1. Get the current purchase state
    const { data: p, error } = await this.supabase
        .from('purchases')
        .select('purchase_qty, balance_qty')
        .eq('trx_id', trx_id)
        .single();
    
    if (error || !p) throw new Error("Purchase record not found.");

    // 2. Fetch Cumulative Balance for this Ticker/Client
    // We need to ensure that reducing this batch's size doesn't make the entire portfolio insolvent.
    const { data: allHoldings, error: hError } = await this.supabase
        .from('purchases')
        .select('balance_qty')
        .eq('client_name', clientName)
        .eq('ticker', ticker)
        .gt('balance_qty', 0);

    if (hError) throw new Error("Failed to validate cumulative balance.");

    const totalPortfolioBalance = allHoldings.reduce((sum, h) => sum + Number(h.balance_qty), 0);
    
    // 3. Calculate Delta
    // If I had 10 (Sold 2, Bal 8) and change to 7. 
    // Old Qty: 10. New Qty: 7. Delta: -3.
    // Total Portfolio Bal: 8 (assuming only this lot). 
    // New Total Bal = 8 + (-3) = 5. (Valid, >= 0).
    const delta = newQty - p.purchase_qty;

    if (totalPortfolioBalance + delta < 0) {
         throw new Error(`Cannot reduce quantity. Needed reduction: ${Math.abs(delta)}, Available Portfolio Balance: ${totalPortfolioBalance}`);
    }

    // 4. Update the Purchase
    // We adjust balance by the same delta. ReprocessLedger will handle shifting sales if this lot runs dry.
    const newBalance = p.balance_qty + delta;
    
    await this.supabase
        .from('purchases')
        .update({ purchase_qty: newQty, balance_qty: newBalance })
        .eq('trx_id', trx_id);

    // 5. Reprocess
    await this.reprocessLedger(clientName, ticker, originalDate);
  }

  async editSaleQty(custom_id: string, newQty: number, clientName: string, ticker: string, date: string) {
    // FIX: Route through purchases to get client_id
    const { data: existing } = await this.supabase
        .from('sales')
        .select('*, purchases!inner(clients(client_id))')
        .eq('custom_id', custom_id)
        .limit(1)
        .single();
    
    if(!existing) throw new Error("Sale not found");

    const intent: SaleIntent = {
        custom_id: custom_id,
        purchase_trx_id: null,
        client_name: clientName,
        ticker: ticker,
        date: existing.date,
        sale_qty: newQty, 
        rate: existing.rate,
        user_id: existing.user_id,
        profit_stored: 0,
        comments: existing.comments,
        long_term: false,
        // FIX: Access nested client_id
        client_id: existing.client_id || existing.purchases?.clients?.client_id,
        adjusted_profit_stored: 0
    };

    const overrides = new Map<string, SaleIntent>();
    overrides.set(custom_id, intent);

    await this.reprocessLedger(clientName, ticker, date, overrides);
  }
}