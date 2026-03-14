import { SupabaseClient } from '@supabase/supabase-js';

/**
 * @file fetch-export-data.ts
 * @description Helpers for fetching and merging purchases and sales data from active and archived tables for export.
 */

interface FetchFilters {
    clients: string[];
    ticker: string | null;
}

interface DateRange {
    start: string | null;
    end: string | null;
}

const FY_CUTOFF = '2025-04-01'; // Configuration for Financial Year Switch

/**
 * Helper to construct a single Supabase query for purchases or sales.
 * @param {SupabaseClient} supabase - The Supabase client instance.
 * @param {string} table - The table name to query.
 * @param {FetchFilters} filters - Client and ticker filters.
 * @param {DateRange} range - Date range filters.
 * @param {boolean} isSales - Whether the query is for the sales table.
 * @returns {any} - The Supabase query object.
 */
const buildQuery = (
    supabase: SupabaseClient,
    table: string,
    filters: FetchFilters,
    range: DateRange,
    isSales: boolean
) => {
    // We explicitly fetch the stored profit columns here
    let selectString = '';

    if (isSales) {
        selectString = `
            *,
            profit_stored,
            adjusted_profit_stored,
            purchases!inner (
                date, rate, ticker, client_name,
                clients ( trading_id, dp_id ),
                assets ( stock_name )
            )
        `;
    } else {
        selectString = `
            *,
            clients ( trading_id, dp_id ),
            assets ( stock_name )
        `;
    }

    let query = supabase.from(table).select(selectString);

    // Date Range
    if (range.start) query = query.gte('date', range.start);
    if (range.end) query = query.lte('date', range.end);

    // Client Filter
    if (filters.clients.length > 0) {
        const field = isSales ? 'purchases.client_name' : 'client_name';
        query = query.in(field, filters.clients);
    }

    // Ticker Filter
    if (filters.ticker) {
        const field = isSales ? 'purchases.ticker' : 'ticker';
        query = query.ilike(field, `%${filters.ticker}%`);
    }

    return query;
};

/**
 * Fetches and merges data from both active and archived purchase/sale tables.
 * @param {SupabaseClient} supabase - The Supabase client instance.
 * @param {FetchFilters} filters - Filtering criteria.
 * @param {DateRange} range - Date range for the export.
 * @returns {Promise<{purchases: any[], sales: any[]}>} - Combined data.
 */
export async function fetchExportData(
    supabase: SupabaseClient,
    filters: FetchFilters,
    range: DateRange
) {
    // 1. Determine Scope (Archive vs Active)
    const needsArchive = !range.start || new Date(range.start) < new Date(FY_CUTOFF);
    const needsActive = !range.end || new Date(range.end) >= new Date(FY_CUTOFF);

    const queries = [];

    // 2. Queue Queries
    if (needsArchive) {
        queries.push(buildQuery(supabase, 'purchases_archived', filters, range, false));
        queries.push(buildQuery(supabase, 'sales_archived', filters, range, true));
    } else {
        queries.push(Promise.resolve({ data: [], error: null }));
        queries.push(Promise.resolve({ data: [], error: null }));
    }

    if (needsActive) {
        queries.push(buildQuery(supabase, 'purchases', filters, range, false));
        queries.push(buildQuery(supabase, 'sales', filters, range, true));
    } else {
        queries.push(Promise.resolve({ data: [], error: null }));
        queries.push(Promise.resolve({ data: [], error: null }));
    }

    // 3. Execute Parallel
    const results = await Promise.all(queries);

    // 4. Check Errors
    const error = results.find(r => r.error)?.error;
    if (error) throw error;

    // 5. Merge Results
    const combinedPurchases = [
        ...(results[0].data || []),
        ...(results[2].data || [])
    ];

    const combinedSales = [
        ...(results[1].data || []),
        ...(results[3].data || [])
    ];

    return {
        purchases: combinedPurchases,
        sales: combinedSales
    };
}
