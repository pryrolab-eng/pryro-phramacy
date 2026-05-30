/** Canonical app origin (no trailing slash). */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!url) {
    throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  }
  return url;
}

/** Sign-in page URL; falls back to a relative path when app URL is unset. */
export function getSignInUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return base ? `${base}/sign-in` : "/sign-in";
}
