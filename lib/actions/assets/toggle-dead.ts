"use server"

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * @file toggle-dead.ts
 * @description Admin-restricted server action to batch-toggle the `dead` flag on assets.
 * Groups changes into at most two bulk UPDATE queries (one for marking dead=true,
 * one for dead=false) to minimise database connection checkouts and lock contention.
 */

/**
 * Batch-updates the `dead` column on the `assets` table.
 * Caller must have admin_level >= 1 in the `profiles` table.
 *
 * @param changes - Array of { ticker, dead } pairs describing the desired state.
 * @returns { success: true } on success, or throws an error string on failure.
 */
export async function updateAssetsDeadAction(
    changes: { ticker: string; dead: boolean }[]
): Promise<{ success: true }> {
    if (!changes.length) return { success: true };

    const supabase = await createClient();

    // --- Auth & admin gate ---
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) throw new Error('Not authenticated.');

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('admin_level')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) throw new Error('Could not fetch user profile.');
    if ((profile.admin_level ?? 0) < 1) throw new Error('Insufficient permissions. Admin level >= 1 required.');

    // --- Group by target state ---
    const deadTickers = changes.filter((c) => c.dead).map((c) => c.ticker);
    const activeTickers = changes.filter((c) => !c.dead).map((c) => c.ticker);

    // --- Execute at most two bulk updates ---
    if (deadTickers.length > 0) {
        const { error } = await supabase
            .from('assets')
            .update({ dead: true })
            .in('ticker', deadTickers);

        if (error) throw new Error(`Failed to mark tickers as dead: ${error.message}`);
    }

    if (activeTickers.length > 0) {
        const { error } = await supabase
            .from('assets')
            .update({ dead: false })
            .in('ticker', activeTickers);

        if (error) throw new Error(`Failed to mark tickers as active: ${error.message}`);
    }

    // --- Purge client cache ---
    revalidatePath('/dashboard', 'layout');

    return { success: true };
}
