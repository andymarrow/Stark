import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function middleware(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch (err) {
    // A hiccup reaching the auth service must not take the page down with
    // it. Carrying on leaves the request unauthenticated for server
    // components, which the client session then corrects on its own.
    console.error("[middleware] getUser failed:", err?.message);
    return response;
  }

  // --- BANNED USER CHECK ---
  // This costs a database round-trip, so it runs on real page navigations
  // only. It used to run on every single matched request — including each
  // RSC payload fetch and every link prefetch the router fires on hover —
  // which meant a signed-in user browsing normally generated a steady
  // stream of extra queries, on top of the getUser call above, purely to
  // re-answer a question whose answer almost never changes.
  const isPrefetch = request.headers.get("next-router-prefetch") === "1";
  const isRscPayload = request.headers.get("rsc") === "1";
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");

  if (user && !isPrefetch && !isRscPayload && !isApiRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'banned') {
        // If banned, force sign out and redirect to error page
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('error', 'Account Suspended');
        return NextResponse.redirect(url);
    }
  }

  // Protected Admin Routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!user) {
          return NextResponse.redirect(new URL('/login', request.url));
      }
      // Note: We also check admin role in the AdminGuard component for UX, 
      // but you could double check here for extra security.
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};