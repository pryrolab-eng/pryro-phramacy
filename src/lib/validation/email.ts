/** Practical email check for forms and payment APIs (not full RFC 5322). */
export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export const INVALID_EMAIL_MESSAGE =
  "Enter a valid email address (for example you@example.com).";
