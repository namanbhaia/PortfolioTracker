"use server"

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Updates various preferences in the user's profile.
 * @param {Object} preferences - the preferences object.
 * @returns {Promise<{success: boolean}>}
 */
export async function updateProfilePreferences(preferences: {
    screensaver_click_only?: boolean;
    auto_fold_sidebar?: boolean;
    theme_preference?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('profiles')
        .update(preferences)
        .eq('id', user.id);

    if (error) throw error;

    revalidatePath('/dashboard/profile');
    return { success: true };
}
