import { SupabaseClient } from '@supabase/supabase-js';
import { calculateProfitMetrics, getGrandfatheredRate, isLongTerm } from '@/components/helper/utility';

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
  user_id: string;
  purchase_trx_id: string | null;
  date: string;
  rate: number;
  sale_qty: number;
  comments: string;
  long_term: boolean;
  custom_id: string;
  client_name: string;
  profit_stored: number;
  client_id: string;
  adjusted_profit_stored: number;
  ticker: string;
}

export interface SaleIntent {
  trx_id?: string;
  user_id: string;
  purchase_trx_id: string | null;
  date: string;
  rate: number;
  sale_qty: number;
  comments: string;
  long_term: boolean;
  custom_id: string;
  client_name: string;
  profit_stored: number;
  client_id: string;
  adjusted_profit_stored: number;
  ticker: string;
}

// ==========================================
// 2. Utility Class
// ==========================================

export class TransactionEditor {
  constructor(private supabase: SupabaseClient) { }

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
      .select('*')
      .eq('client_name', clientName)
      .eq('ticker', ticker)
      .or(`date.gte.${impactDate},balance_qty.gt.0`)
      .order('date', { ascending: true });

    if (pError) throw new Error(`Fetch Purchases Failed: ${pError.message}`);

    // FETCH SALES
    const { data: rawSales, error: sError } = await this.supabase
      .from('sales')
      .select('*, purchases!inner(date, ticker)')
      .eq('client_name', clientName)
      .eq('purchases.ticker', ticker) // Filter via joined purchase
      .gte('date', impactDate)
      .order('date', { ascending: true });

    if (sError) throw new Error(`Fetch Sales Failed: ${sError.message}`);

    // ---------------------------------------------------------
    // B. MAP DB TO INTERFACES
    // ---------------------------------------------------------

    let purchases: Purchase[] = (rawPurchases || []).map((p: any) => ({
      ...p,
      sale_ids: p.sale_ids || [],
      balance_qty: Number(p.balance_qty)
    }));

    const salesRows: Sale[] = (rawSales || []).map((s: any) => ({
      ...s,
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
    // 1. Fetch the full Purchase record
    const { data: purchase, error: pError } = await this.supabase
      .from('purchases')
      .select('*')
      .eq('trx_id', trx_id)
      .single();

    if (pError || !purchase) throw new Error("Purchase record not found.");

    // Fetch grandfathered rate once using the purchase ticker
    const cutoffPrice = await getGrandfatheredRate(this.supabase, purchase.ticker);

    const salesToUpdate: any[] = [];

    // 2. Fetch only the sales linked via the purchase's sale_ids column
    if (purchase.sale_ids && purchase.sale_ids.length > 0) {
      const { data: linkedSales } = await this.supabase
        .from('sales')
        .select('*')
        .in('trx_id', purchase.sale_ids);

      if (linkedSales && linkedSales.length > 0) {
        // 3. Recalculate profit for each linked sale
        for (const sale of linkedSales) {

          // Calculate both Standard and Adjusted Profit
          const { profit, adjusted_profit } = calculateProfitMetrics(
            newRate,            // The NEW Purchase Rate
            purchase.date,      // Purchase Date (Required for < 2018 check)
            sale.rate,          // Sale Rate
            cutoffPrice,        // The Grandfathered/Cutoff Rate
            sale.sale_qty       // Quantity
          );

          salesToUpdate.push({
            ...sale,
            profit_stored: profit,
            adjusted_profit_stored: adjusted_profit
          });
        }
      }
    }

    // 4. Construct Payload
    const purchasesToUpdate = [{
      ...purchase,
      rate: newRate
    }];

    const payload = {
      purchases_to_update: purchasesToUpdate,
      sales_to_update: salesToUpdate.length > 0 ? salesToUpdate : undefined
    };

    // 5. Atomic Commit
    const { error } = await this.supabase.rpc('atomic_ledger_update', { payload });
    if (error) throw new Error(`Failed to update rate and recalculate sales: ${error.message}`);
  }

  async editSaleRate(custom_id: string, newRate: number) {
    // 1. Fetch splits with necessary purchase details (date & ticker needed for calc)
    const { data: splits } = await this.supabase
      .from('sales')
      .select('*, purchases(rate, date, ticker)')
      .eq('custom_id', custom_id);

    if (!splits || splits.length === 0) return;

    // 2. Fetch Grandfathered Rate (once for the entire batch)
    // We assume all splits in a custom_id belong to the same ticker
    const ticker = splits[0].purchases?.ticker;
    const cutoffPrice = ticker ? await getGrandfatheredRate(this.supabase, ticker) : null;

    const salesToUpdate: any[] = [];

    // 3. Recalculate Logic
    for (const split of splits) {
      if (!split.purchases) continue; // Safety check

      const purchaseRate = split.purchases.rate;
      const purchaseDate = split.purchases.date;

      // Calculate both Standard and Adjusted Profit
      const { profit, adjusted_profit } = calculateProfitMetrics(
        purchaseRate,   // Original Buy Price
        purchaseDate,   // Original Buy Date
        newRate,        // NEW Sale Price
        cutoffPrice,    // Grandfathered Rate
        split.sale_qty  // Quantity
      );

      salesToUpdate.push({
        ...split,
        rate: newRate,
        profit_stored: profit,
        adjusted_profit_stored: adjusted_profit
      });
    }

    // 4. Atomic Commit
    const payload = {
      sales_to_update: salesToUpdate
    };

    const { error } = await this.supabase.rpc('atomic_ledger_update', { payload });
    if (error) throw new Error(`Failed to update sale rate: ${error.message}`);
  }

  /**
   * 3. Edit Sale Date
   * Updates the date of a sale event (identified by custom_id).
   * Since changing the date can affect FIFO order (Long Term/Short Term status)
   * and which purchase lots are consumed, this triggers a full ledger re-process
   * for the impacted period.
   */
  async editSaleDate(custom_id: string, newDate: string, originalDate: string, clientName: string, ticker: string) {
    // 1. Fetch one representative row for the sale to get metadata (rate, user_id, comments, client_id)
    // We do not need deep joins because client_id is native to the sales table.
    const { data: existing } = await this.supabase
      .from('sales')
      .select('*')
      .eq('custom_id', custom_id)
      .limit(1)
      .single();

    if (!existing) throw new Error("Sale not found");

    // 2. Calculate the Total Quantity for this Sale Event
    // A single sale might be split across multiple rows; we need the sum to recreate the intent.
    const { data: allSplits } = await this.supabase
      .from('sales')
      .select('sale_qty')
      .eq('custom_id', custom_id);

    const totalQty = allSplits?.reduce((acc, s) => acc + s.sale_qty, 0) || 0;

    // 3. Create the 'Intent' Object
    // This represents the "New State" of the sale. ReprocessLedger will use this 
    // to calculate how this single intent splits into new database rows based on available purchases.
    const intent: SaleIntent = {
      user_id: existing.user_id,
      purchase_trx_id: null, // Will be recalculated by FIFO logic
      date: newDate,
      rate: existing.rate,
      sale_qty: totalQty,
      comments: existing.comments,
      long_term: false,      // Will be recalculated based on new date
      custom_id: custom_id,
      client_name: clientName,
      profit_stored: 0,      // Will be recalculated
      client_id: existing.client_id, // Direct access from sales table
      adjusted_profit_stored: 0,
      ticker: ticker
    };

    // 4. Trigger Reprocessing
    // We override the existing sale records for this custom_id with our new Intent.
    // The ledger logic handles deleting the old rows and inserting the new ones atomically.
    const overrides = new Map<string, SaleIntent>();
    overrides.set(custom_id, intent);

    // Determine the "Impact Date": the earlier of the Old Date or New Date.
    // We must re-calculate balances starting from that point to ensure data integrity.
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

    if (!existing) throw new Error("Sale not found");

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