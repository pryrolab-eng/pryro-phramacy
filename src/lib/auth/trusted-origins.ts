import { getAppUrl } from "@/lib/app-url";

const TRUSTED_ORIGINS_ENV = process.env.TRUSTED_ORIGINS?.split(",").map((s) => s.trim()) ?? [];

const DEFAULT_TRUSTED_ORIGINS = [getAppUrl()];

export function getTrustedOrigins(): string[] {
  const origins = new Set([...DEFAULT_TRUSTED_ORIGINS, ...TRUSTED_ORIGINS_ENV]);
  return Array.from(origins);
}

export function isTrustedOrigin(origin: string): boolean {
  const trusted = getTrustedOrigins();
  return trusted.some((t) => {
    if (t.endsWith("*")) {
      const prefix = t.slice(0, -1);
      return origin.startsWith(prefix);
    }
    return origin === t;
  });
}

export function sanitizeRedirectPath(path: string, fallback: string): string {
  if (!path || typeof path !== "string") return fallback;
  
  const normalized = path.startsWith("/") ? path : `/${path}`;
  
  if (normalized.startsWith("//")) return fallback;
  if (normalized.startsWith("/\\")) return fallback;
  if (normalized.includes("://")) return fallback;
  
  const url = new URL(normalized, "http://localhost");
  if (url.hostname !== "localhost") return fallback;
  
  return url.pathname + url.search;
}

export function buildSafeRedirectUrl(path: string): string {
  const safePath = sanitizeRedirectPath(path, "/onboarding");
  return new URL(safePath, getAppUrl()).toString();
}

export function validateCallbackUrl(callbackUrl: string): boolean {
  try {
    const url = new URL(callbackUrl);
    return isTrustedOrigin(url.origin);
  } catch {
    return false;
  }
}