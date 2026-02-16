"use server"

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Pledges shares for a client.
 * If a pledge for the client and ticker already exists, increases the count.
 */
export async function pledgeShares(clientName: string, ticker: string, qty: number) {
    const supabase = await createClient();

    // Fetch current pledged qty and total owned qty
    const [{ data: existingPledge }, { data: holdings }] = await Promise.all([
        supabase
            .from('pledges')
            .select('pledged_qty')
            .eq('client_name', clientName)
            .eq('ticker', ticker)
            .single(),
        supabase
            .from('client_holdings')
            .select('balance_qty')
            .eq('client_name', clientName)
            .eq('ticker', ticker)
    ]);

    const totalOwned = (holdings || []).reduce((sum, h) => sum + Number(h.balance_qty), 0);
    const currentPledged = existingPledge?.pledged_qty || 0;
    const newQty = Number(currentPledged) + Number(qty);

    if (newQty > totalOwned) {
        throw new Error(`Cannot pledge ${qty} more shares. Total owned: ${totalOwned}, Currently pledged: ${currentPledged}.`);
    }

    const { error: upsertError } = await supabase
        .from('pledges')
        .upsert({
            client_name: clientName,
            ticker: ticker,
            pledged_qty: newQty
        }, { onConflict: 'client_name, ticker' });

    if (upsertError) {
        throw new Error(upsertError.message);
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/pledging');
    return { success: true };
}

/**
 * Unpledges shares for a client.
 * Decreases the count and deletes the row if it reaches 0.
 */
export async function unpledgeShares(clientName: string, ticker: string, qty: number) {
    const supabase = await createClient();

    // Fetch current pledged qty
    const { data: existing, error: fetchError } = await supabase
        .from('pledges')
        .select('pledged_qty')
        .eq('client_name', clientName)
        .eq('ticker', ticker)
        .single();

    if (fetchError || !existing) {
        throw new Error("No pledged shares found for this asset.");
    }

    const newQty = Math.max(0, existing.pledged_qty - Number(qty));

    if (newQty === 0) {
        const { error: deleteError } = await supabase
            .from('pledges')
            .delete()
            .eq('client_name', clientName)
            .eq('ticker', ticker);

        if (deleteError) throw new Error(deleteError.message);
    } else {
        const { error: updateError } = await supabase
            .from('pledges')
            .update({ pledged_qty: newQty })
            .eq('client_name', clientName)
            .eq('ticker', ticker);

        if (updateError) throw new Error(updateError.message);
    }

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/pledging');
    return { success: true };
}
