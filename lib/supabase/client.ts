import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        console.error("Supabase Environment Variables are missing! Check your .env.local file.");
    }

    return createBrowserClient(
        url || '',
        anonKey || ''
    )
}