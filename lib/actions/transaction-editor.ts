import { SupabaseClient } from '@supabase/supabase-js';

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
  purchase_qty: number; // Mapped from DB 'qty'
  comments: string;
  sale_ids: string[];   // UUID[]
  client_id: string;    // Joined from 'clients' table
  balance_qty: number;
}

export interface Sale {
  trx_id: string;
  custom_id: string;    // The "Master" Transaction ID
  purchase_trx_id: string | null;
  client_name: string;
  ticker: string;
  date: string;
  sale_qty: number;     // Mapped from DB 'qty'
  rate: number;
  user_id: string;
  profit_stored: number;
  comments: string;
  long_term: boolean;   // Calculated
  client_id: string;    // Joined from 'clients' table
  adjusted_profit_stored: number;
}

export interface SaleIntent {
  trx_id?: string;      // Optional, usually preserving original ID
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

  /** Helper: Generate UUIDs locally */
  private generateUUID(): string {
    return crypto.randomUUID();
  }

  /** Helper: Check Long Term Status (> 365 Days) */
  private isLongTerm(purchaseDate: string, saleDate: string): boolean {
    const start = new Date(purchaseDate).getTime();
    const end = new Date(saleDate).getTime();
    // Difference in milliseconds / (1000 * 60 * 60 * 24)
    const diffDays = (end - start) / 86400000; 
    return diffDays > 365;
  }

  /**
   * CORE LOGIC: Reprocesses the ledger from a specific date.
   * * @param clientName - Context for the re-calc
   * @param ticker - Context for the re-calc
   * @param impactDate - The date from which we must "rewind" and "replay"
   * @param overrides - Optional map of edited transactions to replace DB records
   */
  private async reprocessLedger(
    clientName: string,
    ticker: string,
    impactDate: string,
    overrides?: Map<string, SaleIntent>
  ) {
    // ---------------------------------------------------------
    // A. FETCH DATA
    // ---------------------------------------------------------
    
    // Fetch Purchases (Open OR Future)
    // We join 'clients' to ensure we populate 'client_id' for the interface
    const { data: rawPurchases, error: pError } = await this.supabase
      .from('purchases')
      .select('*, clients!inner(client_id)')
      .eq('client_name', clientName)
      .eq('ticker', ticker)
      .or(`date.gte.${impactDate},balance_qty.gt.0`)
      .order('date', { ascending: true });

    if (pError) throw new Error(`Fetch Purchases Failed: ${pError.message}`);

    // Fetch Sales (On or After Impact Date)
    // We join 'purchases' to access the original buy date for LT/ST calc if needed
    const { data: rawSales, error: sError } = await this.supabase
      .from('sales')
      .select('*, clients!inner(client_id), purchases(date)') 
      .eq('client_name', clientName)
      .eq('ticker', ticker)
      .gte('date', impactDate)
      .order('date', { ascending: true });

    if (sError) throw new Error(`Fetch Sales Failed: ${sError.message}`);

    // ---------------------------------------------------------
    // B. MAP DB TO INTERFACES
    // ---------------------------------------------------------

    let purchases: Purchase[] = (rawPurchases || []).map((p: any) => ({
      ...p,
      purchase_qty: Number(p.qty), // Map generic 'qty' to specific interface
      client_id: p.clients?.client_id,
      sale_ids: p.sale_ids || [],
      balance_qty: Number(p.balance_qty)
    }));

    const salesRows: Sale[] = (rawSales || []).map((s: any) => ({
      ...s,
      sale_qty: Number(s.qty), // Map generic 'qty' to specific interface
      client_id: s.clients?.client_id,
      long_term: s.purchases?.date ? this.isLongTerm(s.purchases.date, s.date) : false
    }));

    // ---------------------------------------------------------
    // C. UNLINK STEP (Calculate "Restored" State)
    // ---------------------------------------------------------
    
    // 1. Identify which Custom IDs (Batches) need to be wiped and re-calculated.
    //    This includes ALL fetched future sales, PLUS any overrides passed in.
    const customIdsToReprocess = new Set<string>();
    
    salesRows.forEach(s => customIdsToReprocess.add(s.custom_id));
    if (overrides) {
        for (const cid of overrides.keys()) customIdsToReprocess.add(cid);
    }

    // 2. Identify the specific DB Transaction IDs (Splits) to unlink
    const salesTrxIdsToUnlink = new Set(
        salesRows.filter(s => customIdsToReprocess.has(s.custom_id)).map(s => s.trx_id)
    );

    // 3. Reset Purchase Balances in Memory
    purchases = purchases.map(p => {
      const currentSaleIds = p.sale_ids || [];
      // Remove the IDs of the sales we are effectively deleting
      const validSaleIds = currentSaleIds.filter(id => !salesTrxIdsToUnlink.has(id));

      // Add back the quantity that was consumed by these sales
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
    // D. AGGREGATE STEP (Build the "To-Be-Processed" Queue)
    // ---------------------------------------------------------
    const salesOrdersMap = new Map<string, SaleIntent>();

    // 1. Add existing DB sales to the map (aggregating splits back to Master)
    salesRows.forEach(split => {
      // If an override exists for this ID, SKIP the DB version entirely
      if (overrides?.has(split.custom_id)) return;

      if (!salesOrdersMap.has(split.custom_id)) {
        salesOrdersMap.set(split.custom_id, {
          ...split,
          sale_qty: 0, // Reset for accumulation
          profit_stored: 0, // Will Recalc
          adjusted_profit_stored: 0 // Will Recalc
        });
      }
      const order = salesOrdersMap.get(split.custom_id)!;
      order.sale_qty += split.sale_qty;
    });

    // 2. Inject Overrides (The modified user edits)
    if (overrides) {
        for (const [cid, intent] of overrides.entries()) {
            salesOrdersMap.set(cid, intent);
        }
    }

    // 3. Sort by Date for FIFO execution
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

      // Filter eligible purchases: Bought BEFORE sale, has Balance
      const eligiblePurchases = purchases.filter(p => 
        (p.balance_qty > 0) && (new Date(p.date) <= new Date(order.date))
      );

      // Validate Solvency
      const totalAvailable = eligiblePurchases.reduce((sum, p) => sum + p.balance_qty, 0);
      if (totalAvailable < qtyRemaining) {
         throw new Error(`Insufficient balance for Sale ${order.custom_id}. Needed ${qtyRemaining}, Found ${totalAvailable}`);
      }

      // Allocate
      for (const p of eligiblePurchases) {
        if (qtyRemaining <= 0) break;

        const take = Math.min(p.balance_qty, qtyRemaining);
        
        // Update Purchase Memory
        p.balance_qty -= take;
        
        // Generate NEW ID for this split and Link it
        const newSplitId = this.generateUUID();
        p.sale_ids.push(newSplitId);
        
        // Mark purchase for DB update
        purchasesToUpdate.set(p.trx_id, { ...p });

        // Calculate Metrics
        const profit = (order.rate - p.rate) * take;
        const isLT = this.isLongTerm(p.date, order.date);

        // Add to Insert Queue
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
          adjusted_profit_stored: profit, // Logic for adjustments can go here if needed
          user_id: order.user_id,
          comments: order.comments,
          long_term: isLT,
          client_id: order.client_id
        });

        qtyRemaining -= take;
      }
    }

    // ---------------------------------------------------------
    // F. COMMIT (Atomic RPC Call)
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

  /** * 1. Edit Purchase Rate
   * Updates rate and recalculates profit for linked sales instantly.
   */
  async editPurchaseRate(trx_id: string, newRate: number) {
    // 1. Update the purchase itself
    const { data: purchase, error } = await this.supabase
      .from('purchases')
      .update({ rate: newRate })
      .eq('trx_id', trx_id)
      .select()
      .single();
    
    if (error) throw error;

    // 2. Find directly linked sales and update profit snapshots
    const { data: linkedSales } = await this.supabase
      .from('sales')
      .select('*')
      .eq('purchase_trx_id', trx_id);

    if (linkedSales && linkedSales.length > 0) {
      for (const sale of linkedSales) {
        const newProfit = (sale.rate - newRate) * sale.qty;
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

  /** * 2. Edit Sales Rate
   * Updates rate and recalculates profit for specific sales.
   */
  async editSaleRate(custom_id: string, newRate: number) {
    // Fetch splits to get purchase rate
    const { data: splits } = await this.supabase
      .from('sales')
      .select('*, purchases(rate)')
      .eq('custom_id', custom_id);
    
    if (!splits) return;

    for (const split of splits) {
      const purchaseRate = split.purchases.rate;
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

  /** * 3. Edit Sales Date
   * Changing date may alter FIFO order; triggers re-process.
   */
  async editSaleDate(custom_id: string, newDate: string, originalDate: string, clientName: string, ticker: string) {
    // Fetch existing details to preserve them
    const { data: existing } = await this.supabase
        .from('sales')
        .select('*, clients!inner(client_id)')
        .eq('custom_id', custom_id)
        .limit(1)
        .single();
    
    if(!existing) throw new Error("Sale not found");

    // We need total qty across all splits
    const { data: allSplits } = await this.supabase.from('sales').select('qty').eq('custom_id', custom_id);
    const totalQty = allSplits?.reduce((acc, s) => acc + s.qty, 0) || 0;

    const intent: SaleIntent = {
        custom_id: custom_id,
        purchase_trx_id: null, // Will be re-linked
        client_name: clientName,
        ticker: ticker,
        date: newDate, // UPDATED
        sale_qty: totalQty,
        rate: existing.rate,
        user_id: existing.user_id,
        profit_stored: 0,
        comments: existing.comments,
        long_term: false, // Calculated in logic
        client_id: existing.clients.client_id,
        adjusted_profit_stored: 0
    };

    const overrides = new Map<string, SaleIntent>();
    overrides.set(custom_id, intent);

    // Process from the earlier of the two dates
    const impactDate = new Date(newDate) < new Date(originalDate) ? newDate : originalDate;
    await this.reprocessLedger(clientName, ticker, impactDate, overrides);
  }

  /** * 4. Edit Purchase Date
   * Changing buy date affects availability for sales; triggers re-process.
   */
  async editPurchaseDate(trx_id: string, newDate: string, originalDate: string, clientName: string, ticker: string) {
    // 1. Update the purchase date directly
    await this.supabase.from('purchases').update({ date: newDate }).eq('trx_id', trx_id);

    // 2. Reprocess Ledger
    const impactDate = new Date(newDate) < new Date(originalDate) ? newDate : originalDate;
    await this.reprocessLedger(clientName, ticker, impactDate);
  }

  /** * 5. Edit Purchase Qty
   * Complex validation: Cannot reduce below what is already sold.
   */
  async editPurchaseQty(trx_id: string, newQty: number, clientName: string, ticker: string, originalDate: string) {
    const { data: p } = await this.supabase.from('purchases').select('qty, balance_qty').eq('trx_id', trx_id).single();
    
    const soldQty = p.qty - p.balance_qty;
    if (newQty < soldQty) {
       throw new Error(`Cannot reduce quantity below ${soldQty} as these units are already sold.`);
    }

    // Update DB with new Qty and Balance
    const newBalance = newQty - soldQty;
    await this.supabase.from('purchases').update({ qty: newQty, balance_qty: newBalance }).eq('trx_id', trx_id);

    // Reprocess to ensure FIFO order is optimal
    await this.reprocessLedger(clientName, ticker, originalDate);
  }

  /** * 6. Edit Sales Qty
   * Increases or decreases sale size; triggers re-process with override.
   */
  async editSaleQty(custom_id: string, newQty: number, clientName: string, ticker: string, date: string) {
    const { data: existing } = await this.supabase
        .from('sales')
        .select('*, clients!inner(client_id)')
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
        sale_qty: newQty, // UPDATED
        rate: existing.rate,
        user_id: existing.user_id,
        profit_stored: 0,
        comments: existing.comments,
        long_term: false,
        client_id: existing.clients.client_id,
        adjusted_profit_stored: 0
    };

    const overrides = new Map<string, SaleIntent>();
    overrides.set(custom_id, intent);

    await this.reprocessLedger(clientName, ticker, date, overrides);
  }
}