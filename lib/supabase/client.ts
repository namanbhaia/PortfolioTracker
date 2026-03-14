import { createBrowserClient } from '@supabase/ssr'

/**
 * @file client.ts
 * @description Initializes the Supabase client for use in Client Components.
 */

/**
 * Creates a browser-side Supabase client.
 * @returns {any} - The Supabase browser client.
 */
export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase environment variables are missing!')
    }

    return createBrowserClient(supabaseUrl, supabaseKey)
}