"use server"

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

/**
 * @file sync-assets.ts
 * @description Background action to sync market data. Using Supabase Edge Function now instead of Yahoo Finance API.
 */

export async function syncAssetsAction() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  try {
    const { data, error } = await supabase.functions.invoke('sync-assets-sheet', {
      body: { name: 'Functions' },
    });

    if (error) throw error;

    revalidatePath('/');
    return { success: true, message: `Successfully triggered sheet sync.` };

  } catch (error: any) {
    console.error("Sync Error:", error.message);
    return { success: false, error: error.message };
  }
}
