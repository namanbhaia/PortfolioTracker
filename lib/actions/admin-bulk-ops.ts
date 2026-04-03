"use server"

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { TransactionEditor } from './transaction-editor';
import { LedgerRepository } from './ledger-repository';

/**
 * @file admin-bulk-ops.ts
 * @description Administrative actions for bulk data operations, including asset updates and ledger commits.
 */

/**
 * Bulk updates or inserts asset records.
 * Uses the 'bulk_asset_update' SQL function for atomic processing and ticker/PK management.
 * @param {Record<string, unknown>[]} assetsToUpsert - Array of asset data to update/insert.
 * @returns {Promise<{success: boolean}>}
 */
export async function bulkAssetUpdateAction(assetsToUpsert: Record<string, unknown>[]) {
    const supabase = await createClient();

    const { error } = await supabase.rpc('bulk_asset_update', {
        payload: { assets_to_upsert: assetsToUpsert }
    });

    if (error) {
        console.error("Bulk Asset Update Error:", error);
        throw new Error(error.message);
    }

    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * Triggers the migrate_bse_to_nse SQL function.
 */
export async function runBseToNseMigrationAction() {
    const supabase = await createClient();

    const { error } = await supabase.rpc('migrate_bse_to_nse');

    if (error) {
        console.error("BSE to NSE Migration Error:", error);
        throw new Error(error.message);
    }

    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * Bulk processes purchase and sale records using the atomic_ledger_update function.
 * @param {Object} payload - The update payload containing insertions, updates, and deletions.
 * @returns {Promise<{success: boolean}>}
 */
export async function bulkLedgerUpdateAction(payload: {
    purchases_to_insert?: Record<string, unknown>[],
    sales_to_insert?: Record<string, unknown>[],
    purchases_to_update?: Record<string, unknown>[],
    sales_to_delete?: string[],
    sales_to_update?: Record<string, unknown>[]
}) {
    const supabase = await createClient();

    const { error } = await supabase.rpc('atomic_ledger_update', {
        payload
    });

    if (error) {
        console.error("Bulk Ledger Update Error:", error);
        throw new Error(error.message);
    }

    revalidatePath('/dashboard');
    return { success: true };
}

/**
 * MIGRATION ONLY: Remaps all sales for all clients to follow the current logic.
 * Temporary action requested by the user.
 */
export async function remapAllLedgersAction() {
    const supabase = await createClient();
    const repo = new LedgerRepository(supabase);
    const editor = new TransactionEditor(repo);
    
    // Fetch unique client-ticker pairs from purchases
    const { data: purchases, error } = await supabase
        .from('purchases')
        .select('client_name, ticker');
        
    if (error) throw new Error(error.message);
    if (!purchases) return { success: true };
    
    const uniquePairsArray: { client_name: string, ticker: string }[] = [];
    const seen = new Set<string>();
    
    for (const p of purchases) {
        const key = `${p.client_name}::${p.ticker}`;
        if (!seen.has(key)) {
            seen.add(key);
            if (p.client_name && p.ticker) {
                uniquePairsArray.push({ client_name: p.client_name, ticker: p.ticker });
            }
        }
    }
    
    for (const pair of uniquePairsArray) {
        try {
            console.log(`Remapping ${pair.client_name} - ${pair.ticker}`);
            await editor.remapEntireLedger(pair.client_name, pair.ticker);
        } catch (err: any) {
            console.error(`Failed remapping for ${pair.client_name} - ${pair.ticker}:`, err);
        }
    }
    
    revalidatePath('/dashboard');
    return { success: true };
}
