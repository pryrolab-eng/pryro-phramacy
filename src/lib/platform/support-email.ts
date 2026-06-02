/** Fallback when `supportEmail` is not set in platform settings. */
export const DEFAULT_PLATFORM_SUPPORT_EMAIL = "support@pryrox.com";

export function normalizeSupportEmail(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_PLATFORM_SUPPORT_EMAIL;
  const trimmed = value.trim();
  if (!trimmed || !trimmed.includes("@")) return DEFAULT_PLATFORM_SUPPORT_EMAIL;
  return trimmed;
}

export function buildSupportMailto(email: string, subject: string): string {
  return `mailto:${normalizeSupportEmail(email)}?subject=${encodeURIComponent(subject)}`;
}
