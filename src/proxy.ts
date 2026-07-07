import { updateSession } from "@/lib/middleware/update-session";
import { type NextRequest } from "next/server";

/**
 * Renamed from `middleware.ts` (deprecated in Next 16). A `proxy.ts` file runs
 * on the Node.js runtime, so it is NOT subject to the 1 MB Edge Function bundle
 * limit and can safely import Prisma-backed modules (rate limiting, IP
 * whitelist, maintenance mode, platform-admin checks) used by updateSession.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Must be a static string (or static array of strings) — Next.js cannot
 * analyze spread/computed matchers at compile time. Path gating uses
 * middlewareShouldRun() in lib/middleware/auth-routes.ts.
 */
export const config = {
  matcher: [
    // Require at least one path segment so "/" (marketing) skips middleware entirely.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).+)",
  ],
};
