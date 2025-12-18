import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);
const isLoginRoute = createRouteMatcher(['/login']);

export default clerkMiddleware(async (auth, req) => {
  // 1. Get the user ID (New Syntax: await auth())
  const { userId } = await auth();

  // 2. If user is ALREADY logged in and visits /login, kick them to /dashboard
  if (userId && isLoginRoute(req)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 3. If user is NOT logged in and visits /dashboard, protect it
  // (New Syntax: await auth.protect())
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};