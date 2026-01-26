import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * @file middleware.ts
 * @description This middleware handles authentication and route protection for the application.
 * It ensures that unauthenticated users cannot access protected dashboard routes and
 * authenticated users are redirected away from public authentication pages.
 *
 * The Supabase server client is initialized here to access user sessions from server-side requests.
 * This pattern is crucial for protecting routes in Next.js applications using Supabase.
 */

export async function middleware(request: NextRequest) {
	// Initialize a response object that will be passed through the middleware chain.
	let response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	});

	// Create a Supabase client that can be used in server-side logic.
	// This client is configured to handle cookies for authentication.
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				get(name: string) {
					return request.cookies.get(name)?.value;
				},
				set(name: string, value: string, options: CookieOptions) {
					// A new response object must be created when setting cookies.
					request.cookies.set({ name, value, ...options });
					response = NextResponse.next({
						request: {
							headers: request.headers,
						},
					});
					response.cookies.set({ name, value, ...options });
				},
				remove(name: string, options: CookieOptions) {
					// A new response object must be created when removing cookies.
					request.cookies.set({ name, value: "", ...options });
					response = NextResponse.next({
						request: {
							headers: request.headers,
						},
					});
					response.cookies.set({ name, value: "", ...options });
				},
			},
		},
	);

	// Fetch the user data from Supabase. This is the core of the authentication check.
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// --- Route Protection Logic ---

	// 1. Protect Dashboard Routes: If a user is not logged in and attempts to access
	//    any URL starting with '/dashboard', they are redirected to the login page.
	if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// 2. Prevent Authenticated Users from Accessing Auth Pages: If a user is logged in
	//    and tries to visit the login, signup, or reset-password pages, they are
	//    redirected to their main dashboard.
	const authPages = ["/login", "/signup", "/reset-password"];
	if (user && authPages.includes(request.nextUrl.pathname)) {
		return NextResponse.redirect(new URL("/dashboard/holdings", request.url));
	}

	// If no redirection is needed, continue the request-response cycle.
	return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - auth/callback (important: don't block the callback route!)
         */
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - auth/callback (important: don't block the callback route!)
         * - / (the root route, our new landing page)
         */
        '/((?!_next/static|_next/image|favicon.ico|auth/callback|/$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}