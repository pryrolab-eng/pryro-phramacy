const buckets = new Map<string, number[]>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 3;

export function resendConfirmationRateLimitKey(
  email: string,
  ip: string | null,
): string {
  return `${email.trim().toLowerCase()}|${ip ?? "unknown"}`;
}

/** Returns false when rate limit exceeded. */
export function consumeResendConfirmationSlot(key: string): boolean {
  const now = Date.now();
  const recent =
    buckets.get(key)?.filter((t) => now - t < WINDOW_MS) ?? [];
  if (recent.length >= MAX_PER_WINDOW) return false;
  recent.push(now);
  buckets.set(key, recent);
  return true;
}

export const RESEND_CONFIRMATION_RATE_LIMIT_MESSAGE =
  "Too many resend attempts. Please wait about 15 minutes and try again.";
