'use server';

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// 1. Updated Schema to include start_date and end_date
const searchSchema = z.object({
  client_name: z.string().optional(),
  ticker: z.string().optional(),
  start_date: z.string().optional(), // Added
  end_date: z.string().optional(),   // Added
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

  // Destructure new date fields
  const { client_name, ticker, start_date, end_date, trx_id } = parsed.data;
  
  if (start_date && end_date && start_date > end_date) {
    return { 
      purchases: [], 
      sales: [], 
      error: "The 'From Date' cannot be later than the 'To Date'." 
    };
  }

  const today = new Date().toISOString().split('T')[0];

  if (end_date && end_date > today) {
      return { error: "Future dates are not permitted for historical lookup." };
  }

  // 2. Updated Broad Search Rule: Check for date range instead of single date
  const hasDateRange = start_date || end_date;
  
  if (
    (client_name && !ticker && !hasDateRange && !trx_id) || 
    (hasDateRange && !client_name && !ticker && !trx_id)
  ) {
    return { purchases: [], sales: [], error: "Search is too broad. Please provide more criteria." };
  }

  try {
    let purchaseQuery = supabase.from('purchases').select('trx_id');

    // Transaction ID logic remains the same
    if (trx_id) {
        const { data: sale } = await supabase
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

    // 3. New Date Range Query Logic
    if (start_date) {
      purchaseQuery = purchaseQuery.gte('date', start_date);
    }
    if (end_date) {
      purchaseQuery = purchaseQuery.lte('date', end_date);
    }

    const { data: purchaseIdsData, error: purchaseIdsError } = await purchaseQuery;
    if (purchaseIdsError) throw purchaseIdsError;

    const purchaseIds = purchaseIdsData.map((p) => p.trx_id);

    if (purchaseIds.length === 0) {
      return { purchases: [], sales: [] };
    }

    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select('*')
      .in('trx_id', purchaseIds);

    if (purchasesError) throw purchasesError;

    return { purchases };
  } catch (error: any) {
    console.error(error);
    return { error: error.message };
  }
}