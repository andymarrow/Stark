import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * OAuth / email-link landing point.
 *
 * Uses getAll/setAll rather than the older get/set/remove cookie methods.
 * Real sessions here don't fit in one cookie — a signed-in user with normal
 * Google or GitHub metadata produces roughly 4.2KB of token, which
 * @supabase/ssr splits into `sb-<ref>-auth-token.0` and `.1` (verified
 * against this project's own Supabase). Chunked cookies are exactly the case
 * the legacy single-cookie methods handle worst, since writing a session
 * that needs fewer chunks than the one already stored has to clear the
 * leftover chunk or the next read reassembles a corrupt token and the user
 * looks signed out. setAll gets handed the full set at once, so that
 * bookkeeping is the library's to get right instead of ours.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profile";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth-code-error`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Logged, and carried through to the login screen — this used to fail
    // with a fixed "auth-code-error" that said nothing about what actually
    // went wrong, which made sign-in reports impossible to diagnose.
    console.error("[auth/callback] exchangeCodeForSession failed:", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
