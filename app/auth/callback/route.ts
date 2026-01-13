import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // 'next' is where we want to send the user after the handshake
    const next = searchParams.get('next') ?? '/dashboard/holdings';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // If something goes wrong, send them to an error page or login
    return NextResponse.redirect(`${origin}/login?error=Could not authenticate link`);
}