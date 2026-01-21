'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const searchSchema = z.object({
  client_name: z.string().optional(),
  ticker: z.string().optional(),
  date: z.string().optional(),
  trx_id: z.string().optional(),
});

export async function searchTransactions(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  const parsed = searchSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: 'Invalid form data' };
  }

  const { client_name, ticker, date, trx_id } = parsed.data;

  // Rule: Do not show results if either Client_name or date fields alone are provided.
  if ((client_name && !ticker && !date && !trx_id) || (date && !client_name && !ticker && !trx_id)) {
    return { purchases: [], sales: [], error: "Search is too broad. Please provide more criteria." };
  }


  try {
    // 1. Find initial set of purchase IDs
    let purchaseQuery = supabase.from('purchases').select('trx_id');

    if (trx_id) {
        // If a transaction ID is provided, it could be a purchase or a sale
        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .select('purchase_id')
            .eq('trx_id', trx_id)
            .single();

        if (sale) {
            purchaseQuery = purchaseQuery.eq('trx_id', sale.purchase_id);
        } else {
            purchaseQuery = purchaseQuery.eq('trx_id', trx_id);
        }
    }

    if (client_name) {
      purchaseQuery = purchaseQuery.ilike('client_name', `%${client_name}%`);
    }
    if (ticker) {
      purchaseQuery = purchaseQuery.ilike('ticker', `%${ticker}%`);
    }
    if (date) {
      purchaseQuery = purchaseQuery.eq('date', date);
    }

    const { data: purchaseIdsData, error: purchaseIdsError } = await purchaseQuery;

    if (purchaseIdsError) throw purchaseIdsError;

    const purchaseIds = purchaseIdsData.map((p) => p.trx_id);

    if (purchaseIds.length === 0) {
      return { purchases: [], sales: [] };
    }

    // 2. Get all purchases for those IDs
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .in('trx_id', purchaseIds);

    if (purchasesError) throw purchasesError;

    // 3. Get all sales related to those purchases
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .in('purchase_id', purchaseIds);

    if (salesError) throw salesError;

    return { purchases, sales };
  } catch (error: any) {
    console.error(error);
    return { error: error.message };
  }
}