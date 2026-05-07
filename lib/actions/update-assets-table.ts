"use server"
import { createClient } from '@/lib/supabase/server';
import { appendAndSortAsset } from '@/lib/actions/google-sheets/append-asset';

/**
 * @file update-assets-table.ts
 * @description Action for manually upserting asset records into the database and syncing to Google Sheets.
 */

/**
 * Inserts or updates an asset in the database and adds it to Google Sheets.
 * @param {Object} assetData - The asset details including ticker, name, price, ISIN, and cutoff.
 * @returns {Promise<any>} - The upserted asset record.
 */
export const upsertInAsset = async (assetData: {
    ticker: string,
    name: string,
    price: number,
    isin: string,
    cutoff: number
}) => {
    const supabase = await createClient(); // Ensure you use the server-side client here

    const { data, error } = await supabase
        .from('assets')
        .upsert({
            ticker: assetData.ticker.toUpperCase(),
            stock_name: assetData.name,
            current_price: assetData.price,
            isin: assetData.isin,
            cutoff: assetData.cutoff,
            last_updated: new Date().toISOString()
        }, { onConflict: 'ticker' })
        .select()
        .single();

    if (error) throw error;

    // Sync to Google Sheets
    await appendAndSortAsset(assetData);

    return data;
};