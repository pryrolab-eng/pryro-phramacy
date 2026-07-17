import { planNameToEnum } from "@/lib/subscription/plan-enum";
import {
  isBranchAddonCatalogName,
  isMainTierCatalogRow,
} from "@/lib/subscription/normalize-plan";

export type CatalogPlanLike = {
  id?: string;
  name: string;
  price?: number | string;
  plan_type?: string;
};

/** Normalize DB enum / catalog names for grouping (internal keys). */
export function normalizePlanKey(plan: string | null | undefined): string {
  const raw = String(plan ?? "").trim().toLowerCase();
  if (!raw) return "trial";
  if (raw === "premium") return "premium";
  if (raw === "standard") return "standard";
  if (raw === "trial" || raw === "free") return "trial";
  return planNameToEnum(raw);
}

export function isFreePlanPrice(price: number | string | null | undefined): boolean {
  return Number(price ?? 0) <= 0;
}

function mainTierCatalog(catalog: CatalogPlanLike[]): CatalogPlanLike[] {
  return catalog.filter((p) => isMainTierCatalogRow(p));
}

function findCatalogRow(
  catalog: CatalogPlanLike[],
  opts: {
    catalogPlanName?: string | null;
    enumKey?: string;
  },
): CatalogPlanLike | undefined {
  const rows = mainTierCatalog(catalog);
  const byName = opts.catalogPlanName?.trim().toLowerCase();
  if (byName && !isBranchAddonCatalogName(byName)) {
    const hit = rows.find(
      (p) => String(p.name ?? "").trim().toLowerCase() === byName,
    );
    if (hit) return hit;
  }
  if (opts.enumKey) {
    return rows.find(
      (p) => normalizePlanKey(planNameToEnum(p.name)) === opts.enumKey,
    );
  }
  return undefined;
}

export type PharmacyPlanDisplay = {
  /** Catalog or resolved plan name (e.g. Free Trial, Standard). */
  name: string;
  price: number;
  isFree: boolean;
  /** "Free" or "RWF 50,000/mo" */
  priceLabel: string;
};

/** Authoritative plan label + price for admin / dashboards. */
export function resolvePharmacyPlanDisplay(
  pharmacy: {
    subscription_plan?: string | null;
    catalog_plan_name?: string | null;
    catalog_plan_price?: number | string | null;
    is_free_plan?: boolean | null;
  },
  catalog?: CatalogPlanLike[],
): PharmacyPlanDisplay {
  const catalogRows = mainTierCatalog(catalog ?? []);
  const enumKey = normalizePlanKey(pharmacy.subscription_plan);

  const rawCatalogName = pharmacy.catalog_plan_name?.trim();
  const safeCatalogName =
    rawCatalogName && !isBranchAddonCatalogName(rawCatalogName)
      ? rawCatalogName
      : null;

  let row: CatalogPlanLike | undefined;
  if (safeCatalogName) {
    row = findCatalogRow(catalogRows, { catalogPlanName: safeCatalogName });
  }
  if (!row) {
    row = findCatalogRow(catalogRows, { enumKey });
  }

  const name =
    safeCatalogName ||
    row?.name?.trim() ||
    planDisplayName(pharmacy.subscription_plan, catalogRows);

  const price =
    pharmacy.catalog_plan_price != null
      ? Number(pharmacy.catalog_plan_price)
      : Number(row?.price ?? 0);

  const isFree =
    pharmacy.is_free_plan != null
      ? Boolean(pharmacy.is_free_plan)
      : isFreePlanPrice(price);

  return {
    name,
    price,
    isFree,
    priceLabel: isFree ? "Free" : `RWF ${price.toLocaleString()}/mo`,
  };
}

/** @deprecated Use resolvePharmacyPlanDisplay().name */
export function resolvePharmacyPlanLabel(
  pharmacy: {
    subscription_plan?: string | null;
    catalog_plan_name?: string | null;
    catalog_plan_price?: number | string | null;
    is_free_plan?: boolean | null;
  },
  catalog?: CatalogPlanLike[],
): string {
  return resolvePharmacyPlanDisplay(pharmacy, catalog).name;
}

/** Human-readable plan label from enum key only. */
export function planDisplayName(
  key: string | null | undefined,
  catalog?: CatalogPlanLike[],
): string {
  const normalized = normalizePlanKey(key);

  if (catalog?.length) {
    const row = findCatalogRow(catalog, { enumKey: normalized });
    if (row) return String(row.name);
    if (normalized === "trial") {
      const freeTier = mainTierCatalog(catalog).find((p) =>
        isFreePlanPrice(p.price),
      );
      if (freeTier) return String(freeTier.name);
    }
  }

  switch (normalized) {
    case "premium":
      return "Premium";
    case "standard":
      return "Standard";
    case "trial":
      return "Free plan";
    default: {
      const label = String(key ?? "").trim();
      if (!label) return "Free plan";
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
  }
}

export function planKeysFromCatalog(catalog: CatalogPlanLike[]): string[] {
  const seen = new Set<string>();
  for (const row of mainTierCatalog(catalog)) {
    seen.add(normalizePlanKey(planNameToEnum(row.name)));
  }
  const preferred = ["premium", "standard", "trial"];
  const ordered: string[] = preferred.filter((k) => seen.has(k));
  for (const k of Array.from(seen)) {
    if (!ordered.includes(k)) {
      ordered.push(k);
    }
  }
  return ordered.length > 0 ? ordered : [...preferred];
}

export const PLAN_ORDER = ["premium", "standard", "trial"] as const;

/**
 * Can the store use the app? (Not the plan name.)
 * Legacy DB status `trial` meant "on free plan", not suspended — show as Active.
 */
import { badgeVariantFromTone, type BadgeProps } from "@/components/ui/badge";
import {
  pharmacyAccessTone,
} from "@/lib/ui/status-tone";

export function pharmacyAccessLabel(status: string | null | undefined): string {
  const s = String(status ?? "active").trim().toLowerCase();
  if (s === "suspended") return "Suspended";
  if (s === "inactive") return "Inactive";
  if (s === "pending_payment") return "Pending payment";
  if (s === "subscription_expired") return "Expired";
  if (s === "no_subscription") return "No subscription";
  if (s === "past_due") return "Past due";
  if (s === "subscription_cancelled") return "Cancelled";
  return "Active";
}

export function pharmacyAccessVariant(
  status: string | null | undefined,
): NonNullable<BadgeProps["variant"]> {
  return badgeVariantFromTone(pharmacyAccessTone(status));
}

/** @deprecated Use pharmacyAccessLabel */
export const pharmacyAccountStatusLabel = pharmacyAccessLabel;
/** @deprecated Use pharmacyAccessVariant */
export const pharmacyAccountStatusVariant = pharmacyAccessVariant;

export function subscriptionPlanEnumForApi(
  value: string | null | undefined,
): string {
  const v = String(value ?? "").trim();
  if (v.startsWith("catalog:")) {
    return v;
  }
  const lower = v.toLowerCase();
  if (!lower || lower === "free") return "trial";
  if (lower === "premium" || lower === "standard" || lower === "trial") {
    return lower;
  }
  return planNameToEnum(lower);
}

export type PlanSelectOption = {
  value: string;
  label: string;
  price: number;
  isFree: boolean;
  catalogPlanId?: string;
};

/** One row per catalog plan (no collapsing free plans into one "trial" label). */
export function planSelectOptionsFromCatalog(
  catalog: CatalogPlanLike[],
): PlanSelectOption[] {
  const rows = mainTierCatalog(catalog);

  const options: PlanSelectOption[] = rows.map((row) => {
    const price = Number(row.price ?? 0);
    const isFree = isFreePlanPrice(price);
    const id = row.id ? String(row.id) : undefined;
    const enumVal = planNameToEnum(String(row.name ?? ""));
    return {
      value: id ? `catalog:${id}` : enumVal,
      label: String(row.name ?? "Plan"),
      price,
      isFree,
      catalogPlanId: id,
    };
  });

  if (options.length === 0) {
    return [
      { value: "trial", label: "Free plan", price: 0, isFree: true },
      { value: "standard", label: "Standard", price: 0, isFree: false },
      { value: "premium", label: "Premium", price: 0, isFree: false },
    ];
  }

  return options.sort((a, b) => a.price - b.price);
}
