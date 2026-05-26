import { getPolarClient, isPolarConfigured } from "./client";
import type { PresentmentCurrency } from "@polar-sh/sdk/models/components/presentmentcurrency.js";

export type PlanForPolarSync = {
  id: string;
  name: string;
  price: number | string;
  period?: string | null;
  features?: string[] | null;
  is_active?: boolean | null;
  polar_product_id?: string | null;
};

export type PolarSyncResult =
  | {
      ok: true;
      polarProductId: string;
      action: "created" | "updated" | "recreated" | "skipped";
    }
  | { ok: false; error: string };

function rwfPerUsd(): number {
  const n = Number(process.env.POLAR_RWF_PER_USD ?? "1300");
  return Number.isFinite(n) && n > 0 ? n : 1300;
}

/** Currency Polar charges on card (usd or rwf). Catalog prices stay in RWF. */
export function getPolarPresentmentCurrency(): string {
  return (process.env.POLAR_CHECKOUT_CURRENCY ?? "usd").toLowerCase();
}

function polarCurrency(): string {
  return getPolarPresentmentCurrency();
}

/** Polar product title — uses current plan name from DB (editable in admin). */
function polarProductName(planName: string): string {
  const prefix = process.env.POLAR_PRODUCT_NAME_PREFIX?.trim() ?? "";
  const name = planName.trim();
  if (!prefix) return name;
  if (name.toLowerCase().startsWith(prefix.toLowerCase())) return name;
  return `${prefix}${name}`.trim();
}

/** Convert Pryrox plan price (RWF) to Polar fixed price amount (cents for USD). */
export function planPriceToPolarAmount(priceRwf: number): number {
  const currency = polarCurrency();
  if (currency === "rwf") {
    return Math.max(0, Math.round(priceRwf));
  }
  const usd = priceRwf / rwfPerUsd();
  return Math.max(0, Math.round(usd * 100));
}

function mapRecurringInterval(period?: string | null): "month" | "year" {
  const p = (period ?? "per month").toLowerCase();
  if (p.includes("year")) return "year";
  return "month";
}

/** Normalize DB features (text[] or legacy string) for Polar sync. */
export function normalizePlanFeatures(
  raw: string[] | string | null | undefined
): string[] {
  if (Array.isArray(raw)) {
    return raw.map((f) => String(f).trim()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
  }
  return [];
}

function planDescription(plan: PlanForPolarSync): string {
  const features = normalizePlanFeatures(plan.features);
  const priceRwf = Math.round(Number(plan.price ?? 0));
  const period = plan.period ?? "per month";

  const lines = [
    `${plan.name} — ${priceRwf.toLocaleString()} RWF / ${period}`,
    "",
  ];

  if (features.length > 0) {
    lines.push("What's included:");
    for (const feature of features) {
      lines.push(`• ${feature}`);
    }
  } else {
    lines.push("Subscription plan for Pryrox pharmacy management.");
  }

  return lines.join("\n").slice(0, 2000);
}

function planMetadata(plan: PlanForPolarSync): Record<string, string> {
  const features = normalizePlanFeatures(plan.features);
  const meta: Record<string, string> = {
    pryrox_plan_id: plan.id,
    pryrox_plan_name: plan.name,
    pryrox_price_rwf: String(Math.round(Number(plan.price ?? 0))),
    pryrox_period: plan.period ?? "per month",
  };
  if (features.length > 0) {
    meta.pryrox_features = features.join(" | ").slice(0, 500);
  }
  return meta;
}

function polarErrorMessage(e: unknown): string {
  if (e instanceof Error) {
    const body = (e as Error & { body?: string }).body;
    if (typeof body === "string" && body.length < 500) {
      try {
        const parsed = JSON.parse(body) as { detail?: unknown };
        if (typeof parsed.detail === "string") return parsed.detail;
        if (Array.isArray(parsed.detail)) {
          return parsed.detail
            .map((d) =>
              typeof d === "object" && d && "msg" in d
                ? String((d as { msg: string }).msg)
                : JSON.stringify(d)
            )
            .join("; ");
        }
      } catch {
        return body;
      }
    }
    return e.message;
  }
  return "Polar product sync failed";
}

async function createPolarProduct(
  plan: PlanForPolarSync,
  productName: string,
  recurringInterval: "month" | "year",
  priceAmount: number,
  currency: string,
  metadata: Record<string, string>
) {
  const polar = getPolarClient();
  const created = await polar.products.create({
    name: productName,
    description: planDescription(plan),
    recurringInterval,
    recurringIntervalCount: 1,
    metadata,
    prices: [
      {
        amountType: "fixed",
        priceCurrency: currency as PresentmentCurrency,
        priceAmount,
      },
    ],
  });

  const id = created.id;
  if (!id) {
    throw new Error("Polar did not return a product id");
  }
  return id;
}

/** True if the stored Polar product is missing or not usable for checkout. */
async function polarProductNeedsRecreate(
  polar: ReturnType<typeof getPolarClient>,
  productId: string
): Promise<boolean> {
  try {
    const existing = await polar.products.get({ id: productId });
    const archived =
      (existing as { isArchived?: boolean }).isArchived === true ||
      (existing as { is_archived?: boolean }).is_archived === true;
    return archived;
  } catch {
    return true;
  }
}

/**
 * Create or update a Polar product for a subscription_plans row.
 * Linked by metadata.pryrox_plan_id (stable UUID); name/price/features update on each save.
 * Skips free / inactive plans.
 */
export async function syncPlanToPolar(
  plan: PlanForPolarSync
): Promise<PolarSyncResult> {
  if (!isPolarConfigured()) {
    return { ok: false, error: "Polar is not configured" };
  }

  const priceRwf = Number(plan.price ?? 0);
  const isActive = plan.is_active !== false;

  if (!isActive || priceRwf <= 0) {
    return { ok: true, polarProductId: plan.polar_product_id ?? "", action: "skipped" };
  }

  const polar = getPolarClient();
  const productName = polarProductName(plan.name);
  const recurringInterval = mapRecurringInterval(plan.period);
  const priceAmount = planPriceToPolarAmount(priceRwf);
  const currency = polarCurrency();

  const metadata = planMetadata(plan);
  const description = planDescription(plan);

  try {
    const existingId = plan.polar_product_id?.trim() || null;

    if (existingId) {
      const needsRecreate = await polarProductNeedsRecreate(polar, existingId);

      if (!needsRecreate) {
        try {
          await polar.products.update({
            id: existingId,
            productUpdate: {
              name: productName,
              description,
              metadata,
            },
          });
          return {
            ok: true,
            polarProductId: existingId,
            action: "updated",
          };
        } catch (updateErr) {
          console.warn(
            `Polar update failed for ${plan.name} (${existingId}), creating new product:`,
            polarErrorMessage(updateErr)
          );
        }
      } else {
        console.warn(
          `Polar product ${existingId} for ${plan.name} is archived or missing; creating a new product.`
        );
      }

      const id = await createPolarProduct(
        plan,
        productName,
        recurringInterval,
        priceAmount,
        currency,
        metadata
      );

      return {
        ok: true,
        polarProductId: id,
        action: "recreated",
      };
    }

    const id = await createPolarProduct(
      plan,
      productName,
      recurringInterval,
      priceAmount,
      currency,
      metadata
    );

    return { ok: true, polarProductId: id, action: "created" };
  } catch (e: unknown) {
    const message = polarErrorMessage(e);
    console.error("syncPlanToPolar:", plan.id, plan.name, message, e);
    return { ok: false, error: message };
  }
}
