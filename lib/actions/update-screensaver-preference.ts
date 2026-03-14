"use server"

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * @file update-screensaver-preference.ts
 * @description Action for updating the user's preference for screensaver activation.
 */

/**
 * Updates the 'screensaver_click_only' preference in the user's profile.
 * @param {boolean} clickOnly - Whether the screensaver should only activate on click.
 * @returns {Promise<{success: boolean}>}
 */
export async function updateScreensaverPreference(clickOnly: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('profiles')
        .update({ screensaver_click_only: clickOnly })
        .eq('id', user.id);

    if (error) throw error;

    revalidatePath('/dashboard/profile');
    return { success: true };
}
