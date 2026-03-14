"use server"

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * @file update-profile-name.ts
 * @description Action for updating the user's profile name across the application.
 */

/**
 * Updates the full name in the profiles table and the corresponding personal client record.
 * @param {string} newName - The new name to set.
 * @returns {Promise<{success: boolean}>}
 */
export async function updateProfileName(newName: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // 1. Update Profiles table
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: newName })
        .eq('id', user.id);

    if (profileError) throw profileError;

    // 2. Update Clients table where the user_id matches
    // This ensures the personal client record stays in sync
    await supabase
        .from('clients')
        .update({ client_name: newName })
        .eq('user_id', user.id);

    revalidatePath('/dashboard/profile');
    return { success: true };
}