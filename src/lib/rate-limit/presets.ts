/** Default platform API requests per hour when system_settings has no value. */
export const DEFAULT_PLATFORM_API_RATE_LIMIT = 1000;

export const RATE_LIMIT_PRESETS = {
  /** Sign-in attempts per email + IP. */
  signIn: { max: 10, windowMs: 15 * 60 * 1000 },
  /** 2FA TOTP tries per session + IP. */
  verify2fa: { max: 20, windowMs: 15 * 60 * 1000 },
  /** Complete 2FA session establishment per session + IP. */
  complete2fa: { max: 10, windowMs: 15 * 60 * 1000 },
  /** Resend confirmation email per email + IP. */
  resendConfirmation: { max: 3, windowMs: 15 * 60 * 1000 },
  /** Email change requests per user per hour. */
  changeEmail: { max: 3, windowMs: 60 * 60 * 1000 },
  /** Platform-wide API cap per IP (max filled from system_settings). */
  platformApi: { windowMs: 60 * 60 * 1000 },
} as const;

export const RATE_LIMIT_MESSAGES = {
  generic: "Too many requests. Please try again later.",
  signIn: "Too many sign-in attempts. Please wait about 15 minutes and try again.",
  verify2fa:
    "Too many verification attempts. Please wait before trying again.",
  complete2fa:
    "Too many attempts to complete sign-in. Please start over from sign-in.",
  resendConfirmation:
    "Too many resend attempts. Please wait about 15 minutes and try again.",
  changeEmail:
    "Too many email change requests. Please wait about an hour and try again.",
  platformApi:
    "API rate limit exceeded for this IP. Try again in a few minutes.",
} as const;
