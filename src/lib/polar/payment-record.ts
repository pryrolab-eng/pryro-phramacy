import { getPlatformCurrency } from "@/lib/platform-currency";
import { getPolarPresentmentCurrency } from "@/lib/polar/sync-plan";

/**
 * Pryrox books subscription money in platform currency (RWF).
 * Polar may charge in USD (or rwf) — that is only the payment rail.
 */
export function polarTransactionAmounts(planPriceRwf: number): {
  /** Stored on payment_transactions — matches catalog / invoices */
  amount: number;
  currency: string;
  paymentDetailsSuffix: string;
} {
  const platformCurrency = getPlatformCurrency();
  const polarCurrency = getPolarPresentmentCurrency().toUpperCase();
  const rwf = Math.round(Number(planPriceRwf) || 0);

  const chargedElsewhere = polarCurrency !== platformCurrency;

  return {
    amount: rwf,
    currency: platformCurrency,
    paymentDetailsSuffix: chargedElsewhere
      ? `Polar checkout (card charged in ${polarCurrency})`
      : "Polar checkout",
  };
}

/** Fix legacy rows: amount was catalog RWF but currency column said USD. */
export function normalizeStoredPaymentCurrency(
  amount: number,
  currency: string | null | undefined,
  paymentProvider: string | null | undefined,
): { amount: number; currency: string } {
  const platform = getPlatformCurrency();
  const cur = (currency ?? "").trim().toUpperCase();

  if (paymentProvider === "polar" && cur === "USD" && platform === "RWF") {
    return { amount, currency: platform };
  }

  if (!cur) return { amount, currency: platform };
  return { amount, currency: cur };
}
