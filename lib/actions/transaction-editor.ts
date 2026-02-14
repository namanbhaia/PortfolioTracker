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
  created_at: string;
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
  created_at: string;
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
  created_at: string;
}

// ==========================================
// 2. Utility Class
// ==========================================

export class TransactionEditor {
  constructor(private supabase: SupabaseClient) { }

  private generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * CORE LOGIC: Reprocesses the ledger based on specific impact dates.
   * * LOGIC:
   * 1. Sale Impact: Fetch Sales >= Date. Find their linked purchases. Fetch Purchases >= Earliest Linked Date.
   * 2. Purchase Impact: Fetch Purchases >= Date. Find Sales linked to ANY of those purchases.
   */
  private async reprocessLedger(
    clientName: string,
    ticker: string,
    impact: { saleImpactDate?: string | Date; purchaseImpactDate?: string | Date },
    saleOverrides?: Map<string, SaleIntent>,
    purchaseOverrides?: Map<string, Purchase>
  ) {
    let rawPurchases: any[] = [];
    let rawSales: any[] = [];

    // ---------------------------------------------------------
    // A. FETCH DATA (Branching Logic)
    // ---------------------------------------------------------

    if (impact.saleImpactDate) {
      // === BRANCH 1: SALE EDIT LOGIC ===
      // "Find all sales after the salesImpactDate. Find earliest purchase that these sales refer to."

      // 1. Fetch Target Sales
      const { data: sales, error: sError } = await this.supabase
        .from('sales')
        .select('*, purchases!inner(date, ticker)')
        .eq('client_name', clientName)
        .eq('purchases.ticker', ticker)
        .gte('date', impact.saleImpactDate)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (sError) throw new Error(`Fetch Sales Failed: ${sError.message}`);
      rawSales = sales || [];

      // 2. Find Earliest Linked Purchase Date
      // We look at all the purchases these sales consumed.
      let earliestPurchaseDate = new Date().toISOString();
      let hasLinkedPurchases = false;

      rawSales.forEach(s => {
        if (s.purchases?.date) {
          hasLinkedPurchases = true;
          if (new Date(s.purchases.date) < new Date(earliestPurchaseDate)) {
            earliestPurchaseDate = s.purchases.date;
          }
        }
      });

      // If no sales exist or they aren't linked, fallback to the saleImpactDate itself
      const purchaseFetchDate = hasLinkedPurchases ? earliestPurchaseDate : impact.saleImpactDate;

      // 3. List all purchases after that date (OR bal >= 0)
      const { data: purchases, error: pError } = await this.supabase
        .from('purchases')
        .select('*')
        .eq('client_name', clientName)
        .eq('ticker', ticker)
        .gte('date', purchaseFetchDate)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (pError) throw new Error(`Fetch Purchases Failed: ${pError.message}`);
      rawPurchases = purchases || [];

    } else if (impact.purchaseImpactDate) {
      // === BRANCH 2: PURCHASE EDIT LOGIC ===
      // "Find all purchases after that date. Then find all sales linked to these purchases."

      // 1. Fetch Target Purchases
      const { data: purchases, error: pError } = await this.supabase
        .from('purchases')
        .select('*')
        .eq('client_name', clientName)
        .eq('ticker', ticker)
        .gte('date', impact.purchaseImpactDate)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (pError) throw new Error(`Fetch Purchases Failed: ${pError.message}`);
      rawPurchases = purchases || [];

      // 2. Identify all Sale IDs linked to these purchases
      // We extract the IDs from the authoritative 'sale_ids' array on the purchase records
      const linkedSaleIds = new Set<string>();
      (rawPurchases || []).forEach((p: any) => {
        if (p.sale_ids && Array.isArray(p.sale_ids)) {
          p.sale_ids.forEach((id: string) => linkedSaleIds.add(id));
        }
      });

      if (linkedSaleIds.size > 0) {
        // 3. Fetch Sales using the specific IDs found in the purchases
        const { data: sales, error: sError } = await this.supabase
          .from('sales')
          .select('*, purchases!inner(date, ticker)')
          .eq('client_name', clientName)
          .in('trx_id', Array.from(linkedSaleIds))
          .order('date', { ascending: true })
          .order('created_at', { ascending: true });

        if (sError) throw new Error(`Fetch Sales Failed: ${sError.message}`);
        rawSales = sales || [];
      }
    }

    // ---------------------------------------------------------
    // B. MAP DB TO INTERFACES
    // ---------------------------------------------------------

    let purchases: Purchase[] = rawPurchases.map((p: any) => ({
      ...p,
      sale_ids: p.sale_ids || [],
      balance_qty: Number(p.balance_qty)
    }));

    if (purchaseOverrides) {
      purchases = purchases.map(p => {
        if (purchaseOverrides.has(p.trx_id)) {
          // Merge DB data with Override data
          return { ...p, ...purchaseOverrides.get(p.trx_id)! };
        }
        return p;
      });

      // CRITICAL: Re-sort purchases because overrides might have changed dates
      purchases.sort((a, b) => {
        const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      });
    }

    const salesRows: Sale[] = rawSales.map((s: any) => ({
      ...s,
      ticker: s.purchases?.ticker || ticker,
      long_term: s.purchases?.date ? isLongTerm(s.purchases.date, s.date) : false
    }));

    // ---------------------------------------------------------
    // C. UNLINK STEP
    // ---------------------------------------------------------

    // 1. Identify which sales we are reprocessing (Existing DB rows + New Overrides)
    const customIdsToReprocess = new Set<string>();
    const salesTrxIdsToUnlink = new Set<string>();

    salesRows.forEach(s => {
      customIdsToReprocess.add(s.custom_id);
      salesTrxIdsToUnlink.add(s.trx_id);
    });

    if (saleOverrides) {
      for (const [cid, intent] of saleOverrides.entries()) {
        customIdsToReprocess.add(cid);
        if (intent.trx_id) salesTrxIdsToUnlink.add(intent.trx_id);
      }
    }

    // 2. Initialize Map to track modified purchases
    const purchasesToUpdate = new Map<string, Purchase>();

    // Pre-populate with overrides
    if (purchaseOverrides) {
      for (const [id, p] of purchaseOverrides.entries()) {
        purchasesToUpdate.set(id, p);
      }
    }

    // 3. Unlink Phase: Restore balance to purchases by removing linked sales
    purchases = purchases.map(p => {
      const currentSaleIds = p.sale_ids || [];
      const validSaleIds = currentSaleIds.filter(id => !salesTrxIdsToUnlink.has(id));

      const restoredQty = salesRows
        .filter(s => s.purchase_trx_id === p.trx_id && salesTrxIdsToUnlink.has(s.trx_id))
        .reduce((sum, s) => sum + s.sale_qty, 0);

      const updatedPurchase = {
        ...p,
        sale_ids: validSaleIds,
        balance_qty: p.balance_qty + restoredQty
      };

      // CRITICAL: If we changed the balance or sale_ids, we MUST mark this purchase for update.
      if (restoredQty > 0 || validSaleIds.length !== currentSaleIds.length) {
        purchasesToUpdate.set(updatedPurchase.trx_id, updatedPurchase);
      }

      return updatedPurchase;
    });

    // ---------------------------------------------------------
    // D. AGGREGATE STEP
    // ---------------------------------------------------------
    const salesOrdersMap = new Map<string, SaleIntent>();

    salesRows.forEach(split => {
      if (saleOverrides?.has(split.custom_id)) return;

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

    if (saleOverrides) {
      for (const [cid, intent] of saleOverrides.entries()) {
        salesOrdersMap.set(cid, intent);
      }
    }

    const sortedOrders = Array.from(salesOrdersMap.values()).sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      // Use created_at if available in SaleIntent, default to 0
      const aCreated = (a as any).created_at || 0;
      const bCreated = (b as any).created_at || 0;
      return new Date(aCreated).getTime() - new Date(bCreated).getTime();
    });

    // ---------------------------------------------------------
    // E. REMAP STEP (FIFO Execution)
    // ---------------------------------------------------------
    const salesToInsert: Sale[] = [];

    // purchasesToUpdate is already active and tracking changes.

    // Fetch Grandfathered Rate once (assuming all same ticker in this batch)
    const cutoffPrice = await getGrandfatheredRate(this.supabase, ticker);

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

        // Calculate both Standard and Adjusted Profit
        const { profit, adjusted_profit } = calculateProfitMetrics(
          p.rate,         // Buy Price
          p.date,         // Buy Date
          order.rate,     // Sale Price
          cutoffPrice,    // Grandfathered Rate
          take            // Qty
        );

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
          adjusted_profit_stored: adjusted_profit,
          user_id: order.user_id,
          comments: order.comments,
          long_term: isLT,
          client_id: order.client_id,
          created_at: order.created_at,
        });

        qtyRemaining -= take;
      }
    }

    // ---------------------------------------------------------
    // F. COMMIT
    // ---------------------------------------------------------
    const payload = {
      sales_to_delete: Array.from(salesTrxIdsToUnlink),
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
      ticker: ticker,
      created_at: existing.created_at,
    };

    // 4. Trigger Reprocessing
    // We override the existing sale records for this custom_id with our new Intent.
    // The ledger logic handles deleting the old rows and inserting the new ones atomically.
    const saleOverrides = new Map<string, SaleIntent>();
    saleOverrides.set(custom_id, intent);

    // Determine the "Impact Date": the earlier of the Old Date or New Date.
    // We must re-calculate balances starting from that point to ensure data integrity.
    const impactDate = new Date(newDate) < new Date(originalDate) ? newDate : originalDate;

    await this.reprocessLedger(clientName, ticker, { saleImpactDate: impactDate }, saleOverrides, undefined);
  }

  async editPurchaseDate(trx_id: string, newDate: string, originalDate: string, clientName: string, ticker: string) {
    // 1. Fetch the full Purchase record
    const { data: p, error } = await this.supabase
      .from('purchases')
      .select('*')
      .eq('trx_id', trx_id)
      .single();

    if (error || !p) throw new Error("Purchase record not found.");

    // 2. Create Override Object (In-Memory Only)
    // We update the date on the object, but we DO NOT commit to DB yet.
    // reprocessLedger will handle the commit as part of the atomic transaction.
    const modifiedPurchase: Purchase = {
      ...p,
      date: newDate,
      // Ensure arrays/types are correct for the interface
      sale_ids: p.sale_ids || [],
      client_id: p.client_id,
      balance_qty: Number(p.balance_qty)
    };

    const purchaseOverrides = new Map<string, Purchase>();
    purchaseOverrides.set(trx_id, modifiedPurchase);

    // 3. Calculate Impact Date: Smaller of (Old Date, New Date)
    // We need to reprocess from the earlier of the two dates to ensure FIFO integrity.
    const impactDate = new Date(newDate) < new Date(originalDate) ? newDate : originalDate;

    // 4. Trigger Reprocess with Overrides
    // Pass 'purchaseOverrides' as the 5th argument.
    await this.reprocessLedger(
      clientName,
      ticker,
      { purchaseImpactDate: impactDate },
      undefined, // No sale overrides
      purchaseOverrides // Purchase overrides
    );
  }

  async editPurchaseQty(trx_id: string, newQty: number, clientName: string, ticker: string, originalDate: string) {
    // 1. Get the current purchase state (Fetch '*' because we need the full object for the override)
    const { data: p, error } = await this.supabase
      .from('purchases')
      .select('*')
      .eq('trx_id', trx_id)
      .single();

    if (error || !p) throw new Error("Purchase record not found.");

    // 2. Fetch Cumulative Balance (Validation)
    const { data: allHoldings, error: hError } = await this.supabase
      .from('purchases')
      .select('balance_qty')
      .eq('client_name', clientName)
      .eq('ticker', ticker)
      .gt('balance_qty', 0);

    if (hError) throw new Error("Failed to validate cumulative balance.");

    const totalPortfolioBalance = allHoldings.reduce((sum, h) => sum + Number(h.balance_qty), 0);

    // 3. Calculate Delta and Validate
    const currentQty = Number(p.purchase_qty); // Ensure number
    const currentBal = Number(p.balance_qty);  // Ensure number
    const delta = newQty - currentQty;

    if (totalPortfolioBalance + delta < 0) {
      throw new Error(`Cannot reduce quantity. Needed reduction: ${Math.abs(delta)}, Available Portfolio Balance: ${totalPortfolioBalance}`);
    }

    // 4. Create Override Object (Do NOT update DB yet)
    // We calculate the new balance relative to the current state. 
    // reprocessLedger will add back any "unlinked" sales to this balance during processing.
    const newBalance = currentBal + delta;

    const modifiedPurchase: Purchase = {
      ...p,
      purchase_qty: newQty,
      balance_qty: newBalance,
      // Ensure arrays/types are correct for the interface
      sale_ids: p.sale_ids || [],
      client_id: p.client_id
    };

    const purchaseOverrides = new Map<string, Purchase>();
    purchaseOverrides.set(trx_id, modifiedPurchase);

    // 5. Reprocess with Overrides
    // Pass the overrides map as the 5th argument
    await this.reprocessLedger(
      clientName,
      ticker,
      { purchaseImpactDate: originalDate },
      undefined, // No sale overrides
      purchaseOverrides // Purchase overrides
    );
  }

  async editSaleQty(custom_id: string, newQty: number, clientName: string, ticker: string, date: string) {
    // 1. Fetch sales details
    // Optimization: client_id is natively on sales table
    const { data: existing } = await this.supabase
      .from('sales')
      .select('*')
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
      client_id: existing.client_id,
      adjusted_profit_stored: 0,
      created_at: existing.created_at
    };

    const saleOverrides = new Map<string, SaleIntent>();
    saleOverrides.set(custom_id, intent);

    // Trigger Sale Impact Logic
    await this.reprocessLedger(clientName, ticker, { saleImpactDate: date }, saleOverrides);
  }
}