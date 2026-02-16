"use server"

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
