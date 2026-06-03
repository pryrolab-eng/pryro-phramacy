import { parsePolarMetadata } from "@/lib/polar/fulfillment";

export type PolarFulfillmentPayload = {
  shouldFulfill: boolean;
  metadata: ReturnType<typeof parsePolarMetadata>;
  checkoutId: string | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function checkoutStatus(data: Record<string, unknown>): string {
  const direct = data.status;
  if (typeof direct === "string") return direct.toLowerCase();
  const checkout = asRecord(data.checkout);
  const nested = checkout?.status;
  return typeof nested === "string" ? nested.toLowerCase() : "";
}

function extractMetadata(data: Record<string, unknown>) {
  const checkout = asRecord(data.checkout);
  return parsePolarMetadata(
    (data.metadata as Record<string, unknown>) ??
      (checkout?.metadata as Record<string, unknown>),
  );
}

function extractCheckoutId(data: Record<string, unknown>): string | null {
  if (typeof data.id === "string" && data.id.startsWith("co_")) {
    return data.id;
  }
  const checkout = asRecord(data.checkout);
  if (typeof checkout?.id === "string") {
    return checkout.id;
  }
  if (typeof data.checkout_id === "string") {
    return data.checkout_id;
  }
  return null;
}

/** Map Polar webhook events to subscription fulfillment. */
export function resolvePolarFulfillment(
  type: string,
  data: Record<string, unknown>,
): PolarFulfillmentPayload {
  const metadata = extractMetadata(data);
  const checkoutId = extractCheckoutId(data);
  const status = checkoutStatus(data);

  const paidCheckout =
    type === "checkout.updated" &&
    (status === "succeeded" ||
      status === "confirmed" ||
      status === "completed");

  const subscriptionActive =
    type === "subscription.active" ||
    (type === "subscription.updated" &&
      String(data.status ?? "").toLowerCase() === "active");

  const shouldFulfill =
    type === "order.paid" || subscriptionActive || paidCheckout;

  return { shouldFulfill, metadata, checkoutId };
}
