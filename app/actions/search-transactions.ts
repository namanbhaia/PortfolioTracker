"use server"

import { createClient } from '@/lib/supabase/server';

export async function searchTransactions(formData: FormData) {
    const supabase = await createClient();
    
    // 1. IDENTITY & AUTHORIZATION
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized access." };

    const { data: allowedClients } = await supabase
        .from('clients')
        .select('client_name')
        .eq('user_id', user.id);

    const allowedNames = allowedClients?.map(c => c.client_name) || [];
    if (allowedNames.length === 0) return { purchases: [], sales: [], error: "No authorized clients found." };

    // 2. EXTRACT FORM DATA
    const trx_id = formData.get('trx_id') as string;
    const client_name = formData.get('client_name') as string;
    const ticker = formData.get('ticker') as string;
    const start_date = formData.get('start_date') as string;
    const end_date = formData.get('end_date') as string;

    // 3. SECURE UUID TRACING (THE OVERRIDE)
    // If UUID is present, we ignore all other filters and just return the relational web
    if (trx_id) {
        // A. Verify Ownership of this specific UUID
        const [pVerify, sVerify] = await Promise.all([
            supabase.from('client_holdings').select('trx_id').eq('trx_id', trx_id).in('client_name', allowedNames).single(),
            supabase.from('sales_view').select('trx_id').eq('trx_id', trx_id).in('client_name', allowedNames).single()
        ]);

        if (!pVerify.data && !sVerify.data) {
            return { error: "Transaction not found or access denied." };
        }

        // B. If it's a Purchase UUID
        if (pVerify.data) {
            const { data: primary } = await supabase.from('client_holdings').select('*').eq('trx_id', trx_id).single();
            const { data: boldSales } = await supabase.from('sales_view').select('*').eq('purchase_trx_id', trx_id);

            const customIds = Array.from(new Set(boldSales?.map(s => s.custom_id).filter(Boolean)));
            let relatedSales: any[] = [];
            if (customIds.length > 0) {
                const { data } = await supabase.from('sales_view').select('*').in('custom_id', customIds).not('purchase_trx_id', 'eq', trx_id);
                relatedSales = data || [];
            }

            const rPIds = Array.from(new Set(relatedSales.map(s => s.purchase_trx_id)));
            const { data: relatedPurchases } = await supabase.from('purchases').select('*').in('trx_id', rPIds);

            return {
                purchases: [{ ...primary, is_bold: true }, ...(relatedPurchases || []).map(p => ({ ...p, is_bold: false }))],
                sales: [...(boldSales || []).map(s => ({ ...s, is_bold: true })), ...relatedSales.map(s => ({ ...s, is_bold: false }))]
            };
        }

        // C. If it's a Sale UUID
        if (sVerify.data) {
            const { data: primary } = await supabase.from('sales_view').select('*').eq('trx_id', trx_id).single();
            const { data: linkedP } = await supabase.from('client_holdings').select('*').eq('trx_id', primary.purchase_trx_id).single();
            const { data: relatedS } = await supabase.from('sales_view').select('*').eq('custom_id', primary.custom_id).not('trx_id', 'eq', trx_id);
            
            const rPIds = Array.from(new Set(relatedS?.map(s => s.purchase_trx_id)));
            const { data: relatedP } = await supabase.from('client_holdings').select('*').in('trx_id', rPIds).not('trx_id', 'eq', primary.purchase_trx_id);

            return {
                purchases: [{ ...linkedP, is_bold: true }, ...(relatedP || []).map(p => ({ ...p, is_bold: false }))],
                sales: [{ ...primary, is_bold: true }, ...(relatedS || []).map(s => ({ ...s, is_bold: false }))]
            };
        }
    }

    // 4. STANDARD FILTERING (Only runs if NO UUID is provided)
    
    // Validate Dates for standard searches
    if (start_date && end_date && start_date > end_date) {
        return { error: "The 'From Date' cannot be later than the 'To Date'." };
    }
    const today = new Date().toISOString().split('T')[0];
    if (end_date && end_date > today) {
        return { error: "Future dates are not permitted." };
    }

    // Broad Search Protection
    const onlyName = client_name && !ticker && !start_date && !end_date;
    const onlyDates = !client_name && !ticker && start_date && end_date;
    if (onlyName || onlyDates) {
        return { error: "Search results too broad. Please refine your search." };
    }

    let pQuery = supabase.from('client_holdings').select('*').in('client_name', allowedNames);
    let sQuery = supabase.from('sales_view').select('*').in('client_name', allowedNames);

    if (client_name) { pQuery = pQuery.eq('client_name', client_name); sQuery = sQuery.eq('client_name', client_name); }
    if (ticker) { pQuery = pQuery.ilike('ticker', ticker); sQuery = sQuery.ilike('ticker', ticker); }
    if (start_date) { pQuery = pQuery.gte('date', start_date); sQuery = sQuery.gte('sale_date', start_date); }
    if (end_date) { pQuery = pQuery.lte('date', end_date); sQuery = sQuery.lte('sale_date', end_date); }

    const [pRes, sRes] = await Promise.all([pQuery, sQuery]);

    return {
        purchases: (pRes.data || []).map(p => ({ ...p, is_bold: true })),
        sales: (sRes.data || []).map(s => ({ ...s, is_bold: true }))
    };
}