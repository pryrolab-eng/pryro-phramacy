import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIpFromHeaders } from "@/lib/security/ip-address";
import { consumeRateLimit } from "@/lib/rate-limit/buckets";
import { getPlatformApiRateLimit } from "@/lib/platform-settings";
import { RATE_LIMIT_PRESETS, RATE_LIMIT_MESSAGES } from "@/lib/rate-limit/presets";
import {
  extractPlatformApiKeyToken,
  resolvePlatformApiKey,
} from "@/lib/auth/platform-api-key";

const PLATFORM_API_BYPASS_PREFIXES = [
  "/api/polar/webhook",
  "/api/cron/",
] as const;

export function isPlatformApiRateLimitBypass(pathname: string): boolean {
  return PLATFORM_API_BYPASS_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
}

export function rateLimitJsonResponse(
  message: string,
  retryAfterSec: number,
): NextResponse {
  return NextResponse.json(
    { error: "rate_limit_exceeded", message },
    {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, retryAfterSec)) },
    },
  );
}

export async function enforcePlatformApiRateLimit(
  request: NextRequest,
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/api/") || isPlatformApiRateLimitBypass(pathname)) {
    return null;
  }

  const max = await getPlatformApiRateLimit();
  if (max <= 0) return null;

  const ip = getClientIpFromHeaders(request.headers) || "unknown";
  const windowId = Math.floor(Date.now() / RATE_LIMIT_PRESETS.platformApi.windowMs);
  const bucketKey = `platform-api:${ip}:${windowId}`;

  const result = await consumeRateLimit({
    bucketKey,
    max,
    windowMs: RATE_LIMIT_PRESETS.platformApi.windowMs,
  });

  if (!result.allowed) {
    return rateLimitJsonResponse(
      RATE_LIMIT_MESSAGES.platformApi,
      result.retryAfterSec,
    );
  }

  return null;
}

/** Per-key cap for platform integration keys (external developers). */
export async function enforcePlatformIntegrationKeyRateLimit(
  request: NextRequest,
): Promise<NextResponse | null> {
  const token = extractPlatformApiKeyToken(request);
  if (!token) return null;

  const key = await resolvePlatformApiKey(token);
  if (!key) return null;

  const max = await getPlatformApiRateLimit();
  if (max <= 0) return null;

  const windowId = Math.floor(Date.now() / RATE_LIMIT_PRESETS.platformApi.windowMs);
  const bucketKey = `platform-api-key:${key.id}:${windowId}`;

  const result = await consumeRateLimit({
    bucketKey,
    max,
    windowMs: RATE_LIMIT_PRESETS.platformApi.windowMs,
  });

  if (!result.allowed) {
    return rateLimitJsonResponse(
      RATE_LIMIT_MESSAGES.platformApi,
      result.retryAfterSec,
    );
  }

  return null;
}

export async function enforceAuthRateLimit(input: {
  scope: keyof typeof RATE_LIMIT_PRESETS;
  bucketKey: string;
  message?: string;
}): Promise<{ ok: true } | { ok: false; message: string; retryAfterSec: number }> {
  const preset = RATE_LIMIT_PRESETS[input.scope];
  if (!("max" in preset) || preset.max <= 0) {
    return { ok: true };
  }

  const result = await consumeRateLimit({
    bucketKey: `${input.scope}:${input.bucketKey}`,
    max: preset.max,
    windowMs: preset.windowMs,
  });

  if (result.allowed) return { ok: true };

  const message =
    input.message ??
    RATE_LIMIT_MESSAGES[input.scope as keyof typeof RATE_LIMIT_MESSAGES] ??
    RATE_LIMIT_MESSAGES.generic;

  return { ok: false, message, retryAfterSec: result.retryAfterSec };
}

export function getIpFromRequestHeaders(headers: Headers): string {
  return getClientIpFromHeaders(headers) || "unknown";
}
