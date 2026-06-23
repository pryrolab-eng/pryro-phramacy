import { resolveAppOrigin } from "@/lib/app-url";

/** Canonical post-checkout return URL (Polar, env defaults). */
export const PAYMENT_SUCCESS_PATH = "/payment/success";

/** Override success return base (optional; defaults to resolveAppOrigin()). */
export function paymentSuccessUrl(origin?: string): string {
  const base = (origin || resolveAppOrigin()).replace(/\/$/, "");
  return `${base}${PAYMENT_SUCCESS_PATH}`;
}
