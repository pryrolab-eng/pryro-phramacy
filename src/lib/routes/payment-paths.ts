/** Canonical post-checkout return URL (KPay, Polar, env defaults). */
export const PAYMENT_SUCCESS_PATH = "/payment/success";

export function paymentSuccessUrl(origin?: string): string {
  const base = (
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}${PAYMENT_SUCCESS_PATH}`;
}
