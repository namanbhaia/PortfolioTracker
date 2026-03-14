import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * @file middleware.ts
 * @description Refreshes Auth sessions in the background using Next.js middleware.
 */

/**
 * Refreshes the user's Supabase session and updates cookies.
 * @param {NextRequest} request - The incoming request object.
 * @returns {Promise<NextResponse>} - The updated response with refreshed session cookies.
 */
export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                    })
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 3. Refresh session if needed
    try {
        await supabase.auth.getUser()
    } catch (e) {
        console.error("Middleware Session Refresh Crash:", e)
    }

    return response
}