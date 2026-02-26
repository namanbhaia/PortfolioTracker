"use server"

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Bulk updates or inserts asset records.
 * Uses the 'bulk_asset_update' SQL function for atomic processing and ticker/PK management.
 */
export async function bulkAssetUpdateAction(assetsToUpsert: any[]) {
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
 * Bulk processes purchase and sale records using the atomic_ledger_update function.
 */
export async function bulkLedgerUpdateAction(payload: {
    purchases_to_insert?: any[],
    sales_to_insert?: any[],
    purchases_to_update?: any[],
    sales_to_delete?: any[],
    sales_to_update?: any[]
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
