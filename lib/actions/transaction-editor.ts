import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Types based on your schema
 */
interface Purchase {
  trx_id: string;
  client_name: string;
  ticker: string;
  date: string;
  qty: number;
  rate: number;
  sale_ids: string[]; // UUID[]
  balance_qty: number;
}

interface Sale {
  trx_id: string;
  custom_id: string; // The "Master" Transaction ID
  purchase_trx_id: string | null;
  client_name: string;
  ticker: string;
  date: string;
  qty: number;
  rate: number;
  user_id: string;
  profit_stored: number;
  adjusted_profit_stored: number;
}

interface SaleIntent {
  custom_id: string;
  date: string;
  total_qty: number;
  rate: number;
  client_name: string;
  ticker: string;
  user_id: string;
}

export class TransactionEditor {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Helper: Generate UUIDs locally so we can link them in the same transaction
   */
  private generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * CORE LOGIC: Reprocesses the ledger from a specific date.
   * @param overrides - Optional map of modified sales intents (e.g. if you changed a sale's qty/date)
   */
  private async reprocessLedger(
    clientName: string,
    ticker: string,
    impactDate: string,
    overrides?: Map<string, SaleIntent>
  ) {
    // 1. Fetch relevant data (Purchases & Sales on/after impact)
    const { data: rawPurchases, error: pError } = await this.supabase
      .from('purchases')
      .select('*')
      .eq('client_name', clientName)
      .eq('ticker', ticker)
      .or(`date.gte.${impactDate},balance_qty.gt.0`)
      .order('date', { ascending: true });

    if (pError) throw new Error(`Fetch Purchases Failed: ${pError.message}`);

    const { data: rawSales, error: sError } = await this.supabase
      .from('sales')
      .select('*')
      .eq('client_name', clientName)
      .eq('ticker', ticker)
      .gte('date', impactDate)
      .order('date', { ascending: true });

    if (sError) throw new Error(`Fetch Sales Failed: ${sError.message}`);

    let purchases: Purchase[] = rawPurchases || [];
    const salesRows: Sale[] = rawSales || [];

    // 2. UNLINK STEP: Calculate "Restored" State
    // We identify which sales need to be wiped and re-calculated.
    // If an override exists for a custom_id, we treat the DB version as "to be deleted".
    const customIdsToReprocess = new Set<string>();
    
    // All fetched sales are candidates for reprocessing
    salesRows.forEach(s => customIdsToReprocess.add(s.custom_id));
    if (overrides) {
        for (const cid of overrides.keys()) customIdsToReprocess.add(cid);
    }

    const salesTrxIdsToUnlink = new Set(
        salesRows.filter(s => customIdsToReprocess.has(s.custom_id)).map(s => s.trx_id)
    );

    // Reset Purchase Balances in Memory
    purchases = purchases.map(p => {
      // Remove sale_ids that we are about to delete
      const currentSaleIds = p.sale_ids || [];
      const validSaleIds = currentSaleIds.filter(id => !salesTrxIdsToUnlink.has(id));

      // Add back the qty from the unlinked sales
      const restoredQty = salesRows
        .filter(s => s.purchase_trx_id === p.trx_id && salesTrxIdsToUnlink.has(s.trx_id))
        .reduce((sum, s) => sum + s.qty, 0);

      return {
        ...p,
        sale_ids: validSaleIds,
        balance_qty: (p.balance_qty || 0) + restoredQty
      };
    });

    // 3. AGGREGATE STEP: Build the Queue of "Master Orders"
    const salesOrdersMap = new Map<string, SaleIntent>();

    // A. Add existing DB sales to the map (aggregating splits)
    salesRows.forEach(split => {
      // If we have an override, ignore the DB version
      if (overrides?.has(split.custom_id)) return;

      if (!salesOrdersMap.has(split.custom_id)) {
        salesOrdersMap.set(split.custom_id, {
          custom_id: split.custom_id,
          date: split.date,
          total_qty: 0,
          rate: split.rate,
          client_name: split.client_name,
          ticker: split.ticker,
          user_id: split.user_id
        });
      }
      salesOrdersMap.get(split.custom_id)!.total_qty += split.qty;
    });

    // B. Inject Overrides (The modified transactions)
    if (overrides) {
        for (const [cid, intent] of overrides.entries()) {
            salesOrdersMap.set(cid, intent);
        }
    }

    // Sort by Date for FIFO
    const sortedOrders = Array.from(salesOrdersMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // 4. REMAP STEP: Run FIFO
    const salesToInsert: any[] = [];
    const purchasesToUpdate = new Map<string, Purchase>(); 
    // We map by ID to ensure we capture the final state of a purchase after multiple sales hit it

    for (const order of sortedOrders) {
      let qtyRemaining = order.total_qty;

      // Filter eligible purchases: bought before/on sale date, has balance
      const eligiblePurchases = purchases.filter(p => 
        (p.balance_qty > 0) && (new Date(p.date) <= new Date(order.date))
      );

      // Validation
      const totalAvailable = eligiblePurchases.reduce((sum, p) => sum + p.balance_qty, 0);
      if (totalAvailable < qtyRemaining) {
        throw new Error(`Insufficient balance for Sale ${order.custom_id} (${order.date}). Needed ${qtyRemaining}, had ${totalAvailable}.`);
      }

      for (const p of eligiblePurchases) {
        if (qtyRemaining <= 0) break;

        const take = Math.min(p.balance_qty, qtyRemaining);
        
        // Update Purchase Memory
        p.balance_qty -= take;
        
        // Generate NEW ID for this split
        const newSplitId = this.generateUUID();
        p.sale_ids.push(newSplitId); // Link it!

        purchasesToUpdate.set(p.trx_id, { ...p }); // Track changes

        // Calculate Profit
        const profit = (order.rate - p.rate) * take;

        salesToInsert.push({
          trx_id: newSplitId, // Pre-generated ID
          custom_id: order.custom_id,
          purchase_trx_id: p.trx_id,
          client_name: order.client_name,
          ticker: order.ticker,
          date: order.date,
          qty: take,
          rate: order.rate,
          profit_stored: profit,
          adjusted_profit_stored: profit,
          user_id: order.user_id
        });

        qtyRemaining -= take;
      }
    }

    // 5. COMMIT
    const payload = {
      sales_to_delete: Array.from(customIdsToReprocess),
      purchases_to_update: Array.from(purchasesToUpdate.values()),
      sales_to_insert: salesToInsert
    };

    const { error } = await this.supabase.rpc('atomic_ledger_update', { payload });
    if (error) throw new Error(`Atomic Update Failed: ${error.message}`);
  }

  // ==============================================================================
  // PUBLIC ENTRY POINTS
  // ==============================================================================

  /** 1. Edit Purchase Rate */
  async editPurchaseRate(trx_id: string, newRate: number) {
    // 1. Update the purchase itself
    const { data: purchase, error } = await this.supabase
      .from('purchases')
      .update({ rate: newRate })
      .eq('trx_id', trx_id)
      .select()
      .single();
    
    if (error) throw error;

    // 2. Find directly linked sales and update their profit snapshot
    // (No FIFO change needed, just math)
    const { data: linkedSales } = await this.supabase
      .from('sales')
      .select('*')
      .eq('purchase_trx_id', trx_id);

    if (linkedSales && linkedSales.length > 0) {
      for (const sale of linkedSales) {
        const newProfit = (sale.rate - newRate) * sale.qty;
        await this.supabase
          .from('sales')
          .update({ profit_stored: newProfit, adjusted_profit_stored: newProfit })
          .eq('trx_id', sale.trx_id);
      }
    }
  }

  /** 2. Edit Sales Rate */
  async editSaleRate(custom_id: string, newRate: number) {
    // Update all splits for this custom_id
    // We need to fetch them to recalculate profit based on their specific purchase lots
    const { data: splits } = await this.supabase
      .from('sales')
      .select('*, purchases(rate)')
      .eq('custom_id', custom_id);
    
    if (!splits) return;

    for (const split of splits) {
      const purchaseRate = split.purchases.rate; // Assumes join
      const newProfit = (newRate - purchaseRate) * split.qty;
      
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

  /** 3. Edit Sales Date */
  async editSaleDate(custom_id: string, newDate: string, originalDate: string, client: string, ticker: string) {
    // We must pass this as an override to reprocessLedger
    // First, fetch the original intent details we need (qty, rate, etc)
    const { data: existing } = await this.supabase
        .from('sales')
        .select('*')
        .eq('custom_id', custom_id)
        .limit(1)
        .single();
    
    // Calculate total qty from DB (sum of splits)
    const { data: allSplits } = await this.supabase.from('sales').select('qty').eq('custom_id', custom_id);
    const totalQty = allSplits?.reduce((acc, s) => acc + s.qty, 0) || 0;

    const intent: SaleIntent = {
        custom_id: custom_id,
        date: newDate, // The New Date
        total_qty: totalQty,
        rate: existing.rate,
        client_name: client,
        ticker: ticker,
        user_id: existing.user_id
    };

    const overrides = new Map<string, SaleIntent>();
    overrides.set(custom_id, intent);

    // Reprocess from the earlier of the two dates
    const impactDate = new Date(newDate) < new Date(originalDate) ? newDate : originalDate;
    await this.reprocessLedger(client, ticker, impactDate, overrides);
  }

  /** 4. Edit Purchase Date */
  async editPurchaseDate(trx_id: string, newDate: string, originalDate: string, client: string, ticker: string) {
    // 1. Update the purchase date in DB first
    await this.supabase.from('purchases').update({ date: newDate }).eq('trx_id', trx_id);

    // 2. Reprocess
    // Changing a buy date might mean it is now available for an earlier sale, or unavailable for a later one.
    const impactDate = new Date(newDate) < new Date(originalDate) ? newDate : originalDate;
    await this.reprocessLedger(client, ticker, impactDate);
  }

  /** 5. Edit Purchase Qty */
  async editPurchaseQty(trx_id: string, newQty: number, client: string, ticker: string, originalDate: string) {
    const { data: p } = await this.supabase.from('purchases').select('qty, balance_qty').eq('trx_id', trx_id).single();
    
    // Check if we are reducing below what is already sold
    const soldQty = p.qty - p.balance_qty;
    if (newQty < soldQty) {
       throw new Error(`Cannot reduce quantity below ${soldQty} as these are already sold.`);
    }

    // Update DB
    const newBalance = newQty - soldQty;
    await this.supabase.from('purchases').update({ qty: newQty, balance_qty: newBalance }).eq('trx_id', trx_id);

    // Reprocess (in case the increase allows it to be picked up by earlier sales, though typically FIFO fills oldest first)
    await this.reprocessLedger(client, ticker, originalDate);
  }

  /** 6. Edit Sales Qty */
  async editSaleQty(custom_id: string, newQty: number, client: string, ticker: string, date: string) {
    // Fetch basic details for the intent
    const { data: existing } = await this.supabase
        .from('sales')
        .select('*')
        .eq('custom_id', custom_id)
        .limit(1)
        .single();

    const intent: SaleIntent = {
        custom_id: custom_id,
        date: existing.date,
        total_qty: newQty, // The NEW Quantity
        rate: existing.rate,
        client_name: client,
        ticker: ticker,
        user_id: existing.user_id
    };

    const overrides = new Map();
    overrides.set(custom_id, intent);

    // This will implicitly check if we have enough balance for the increase
    await this.reprocessLedger(client, ticker, date, overrides);
  }
}