"use server"

import { createClient } from '@/lib/supabase/server';

export async function searchTransactions(formData: FormData) {
    const supabase = await createClient();
    const trx_id = formData.get('trx_id') as string;
    const client_name = formData.get('client_name') as string;
    const ticker = formData.get('ticker') as string;
    const start_date = formData.get('start_date') as string;
    const end_date = formData.get('end_date') as string;

    // 1. Validate Broad Searches
    const onlyName = client_name && !ticker && !start_date && !end_date && !trx_id;
    const onlyDates = !client_name && !ticker && start_date && end_date && !trx_id;

    if (onlyName || onlyDates) {
        return { error: "Search results too broad. Use Sales History page instead" };
    }

    let purchases: any[] = [];
    let sales: any[] = [];

    // 2. Specialized Logic: Transaction UUID lookup
    if (trx_id && !client_name && !ticker && !start_date && !end_date) {
        // A. Search in Purchases
        const { data: primaryPurchase } = await supabase
            .from('client_holdings')
            .select('*')
            .eq('trx_id', trx_id)
            .single();

        if (primaryPurchase) {
            // Find linked sales (bold)
            const { data: boldSales } = await supabase
                .from('sales_view')
                .select('*')
                .eq('purchase_trx_id', trx_id);

            // Find related sales via custom_id (non-bold)
            const customIds = Array.from(new Set(boldSales?.map(s => s.custom_id).filter(Boolean)));
            let relatedSales: any[] = [];
            if (customIds.length > 0) {
                const { data } = await supabase
                    .from('sales_view')
                    .select('*')
                    .in('custom_id', customIds)
                    .not('purchase_trx_id', 'eq', trx_id);
                relatedSales = data || [];
            }

            // Find purchases for related sales (non-bold)
            const relatedPurchaseIds = Array.from(new Set(relatedSales.map(s => s.purchase_trx_id)));
            const { data: relatedPurchases } = await supabase
                .from('purchases')
                .select('*')
                .in('trx_id', relatedPurchaseIds);

            return {
                purchases: [
                    { ...primaryPurchase, is_bold: true },
                    ...(relatedPurchases || []).map(p => ({ ...p, is_bold: false }))
                ],
                sales: [
                    ...(boldSales || []).map(s => ({ ...s, is_bold: true })),
                    ...relatedSales.map(s => ({ ...s, is_bold: false }))
                ]
            };
        }

        // B. Search in Sales
        const { data: primarySale } = await supabase
            .from('sales_view')
            .select('*')
            .eq('trx_id', trx_id)
            .single();

        if (primarySale) {
            const { data: linkedPurchase } = await supabase
                .from('client_holdings')
                .select('*')
                .eq('trx_id', primarySale.purchase_trx_id)
                .single();

            const { data: relatedSales } = await supabase
                .from('sales_view')
                .select('*')
                .eq('custom_id', primarySale.custom_id)
                .not('trx_id', 'eq', trx_id);

            const relatedPurchaseIds = Array.from(new Set(relatedSales?.map(s => s.purchase_trx_id)));
            const { data: relatedPurchases } = await supabase
                .from('client_holdings')
                .select('*')
                .in('trx_id', relatedPurchaseIds)
                .not('trx_id', 'eq', primarySale.purchase_trx_id);

            return {
                purchases: [
                    { ...linkedPurchase, is_bold: true },
                    ...(relatedPurchases || []).map(p => ({ ...p, is_bold: false }))
                ],
                sales: [
                    { ...primarySale, is_bold: true },
                    ...(relatedSales || []).map(s => ({ ...s, is_bold: false }))
                ]
            };
        }
    }

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

    // 3. Fallback: Standard combination filtering
    let pQuery = supabase.from('client_holdings').select('*');
    let sQuery = supabase.from('sales_view').select('*');

    if (trx_id) { pQuery = pQuery.eq('trx_id', trx_id); sQuery = sQuery.eq('trx_id', trx_id); }
    if (client_name) { pQuery = pQuery.eq('client_name', client_name); sQuery = sQuery.eq('client_name', client_name); }
    if (ticker) { pQuery = pQuery.eq('ticker', ticker.toUpperCase()); sQuery = sQuery.eq('ticker', ticker.toUpperCase()); }
    if (start_date) { pQuery = pQuery.gte('date', start_date); sQuery = sQuery.gte('sale_date', start_date); }
    if (end_date) { pQuery = pQuery.lte('date', end_date); sQuery = sQuery.lte('sale_date', end_date); }

    const [pRes, sRes] = await Promise.all([pQuery, sQuery]);

    return {
        purchases: (pRes.data || []).map(p => ({ ...p, is_bold: true })),
        sales: (sRes.data || []).map(s => ({ ...s, is_bold: true }))
    };
}