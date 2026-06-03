/**
 * Canonical app origin (no trailing slash).
 * Priority: NEXT_PUBLIC_APP_URL → NEXT_PUBLIC_BASE_URL → VERCEL_URL → localhost.
 */
export function resolveAppOrigin(): string {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export function getAppUrl(): string {
  return resolveAppOrigin();
}

/** Sign-in page URL; relative path only when no origin can be resolved. */
export function getSignInUrl(): string {
  const base = resolveAppOrigin();
  if (base === "http://localhost:3000" && !process.env.NEXT_PUBLIC_APP_URL?.trim()) {
    return "/sign-in";
  }
  return `${base}/sign-in`;
}
