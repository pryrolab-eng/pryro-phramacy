import { updateSession } from "./supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Must be a static string (or static array of strings) — Next.js cannot
 * analyze spread/computed matchers at compile time. Path gating uses
 * middlewareShouldRun() in supabase/middleware.ts.
 */
export const config = {
  matcher: [
    // Require at least one path segment so "/" (marketing) skips middleware entirely.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api).+)",
  ],
};
