import {
  pharmacyAccessLabel,
  resolvePharmacyPlanDisplay,
  type CatalogPlanLike,
} from "@/lib/admin/plan-stats";
import {
  storeFindActiveBranchAddonCatalog,
  storeFindOwnerPublicUser,
  storeFindPharmacyById,
  storeListBranchAddonSubsForAdminPharmacyDetail,
  storeListMainSubsForAdminPharmacyDetail,
} from "@/lib/db/admin-store";
import { resolvePharmacyEntitlements } from "@/lib/subscription/lifecycle/entitlements";
import { normalizeLifecycleStatus } from "@/lib/subscription/lifecycle/status";
import { isMainTierCatalogRow } from "@/lib/subscription/normalize-plan";

export type AdminPharmacyBranchAddonRow = {
  id: string;
  status: string;
  branchName: string | null;
  planName: string;
  price: number;
};

export type AdminPharmacyDetail = {
  pharmacy: Record<string, unknown>;
  owner: { name: string | null; email: string | null } | null;
  plan: {
    name: string;
    priceLabel: string;
    isFree: boolean;
    enumKey: string;
  };
  access: { status: string; label: string };
  mainSubscription: {
    id: string;
    status: string;
    expiresAt: string | null;
    planName: string;
    price: number;
  } | null;
  /** A main subscription in `pending_payment` (usually an upgrade waiting checkout). */
  pendingMainSubscription: {
    id: string;
    status: string;
    expiresAt: string | null;
    planName: string;
    price: number;
  } | null;
  branchAddons: {
    activeCount: number;
    items: AdminPharmacyBranchAddonRow[];
    catalogProductName: string | null;
    catalogProductPrice: number | null;
  };
  capacity: {
    branchesInUse: number;
    slotsFromMainPlan: number;
    slotsFromAddons: number;
    totalSlots: number;
    canAddBranch: boolean;
  };
  entitlements: {
    isAccessAllowed: boolean;
    isExpired: boolean;
    daysRemaining: number | null;
    expiresAt: string | null;
    limits: {
      maxUsers: number;
      maxBranches: number;
      monthlyTxPerBranch: number;
      totalBranchSlots: number;
    };
    usage: { activeUsers: number; activeBranches: number };
    featureCount: number;
  };
};

function formatLifecycleLabel(status: string): string {
  const s = status.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function buildAdminPharmacyDetail(
  pharmacyId: string,
  catalog: CatalogPlanLike[] = [],
): Promise<AdminPharmacyDetail | null> {
  const pharmacy = await storeFindPharmacyById(pharmacyId);
  if (!pharmacy) return null;

  const rawStatus = String(pharmacy.status ?? "active");
  const legacyAccessStatus = rawStatus === "trial" ? "active" : rawStatus;

  const [ent, mainSubRows, addonSubRows, catalogAddon] = await Promise.all([
    resolvePharmacyEntitlements(pharmacyId),
    storeListMainSubsForAdminPharmacyDetail(pharmacyId),
    storeListBranchAddonSubsForAdminPharmacyDetail(pharmacyId),
    storeFindActiveBranchAddonCatalog(),
  ]);

  let mainSubscription: AdminPharmacyDetail["mainSubscription"] = null;
  let pendingMainSubscription: AdminPharmacyDetail["pendingMainSubscription"] =
    null;
  for (const row of mainSubRows) {
    const embedded = (row as {
      subscription_plans?: {
        name?: string;
        price?: unknown;
        plan_type?: string;
      } | null;
    }).subscription_plans;
    if (!embedded || !isMainTierCatalogRow(embedded)) continue;
    const lifecycle = normalizeLifecycleStatus(
      (row as { status?: string }).status,
      {
        is_active: (row as { is_active?: boolean }).is_active,
        payment_method: (row as { payment_method?: string }).payment_method,
        pending_change_status: (row as { pending_change_status?: string })
          .pending_change_status,
      },
    );
    if (lifecycle === "pending_payment" && !pendingMainSubscription) {
      pendingMainSubscription = {
        id: String((row as { id: string }).id),
        status: formatLifecycleLabel(lifecycle),
        expiresAt: (row as { expires_at?: string | null }).expires_at ?? null,
        planName: String(embedded.name ?? "Plan"),
        price: Number(embedded.price ?? 0),
      };
    }

    if (lifecycle !== "active") continue;
    if (!mainSubscription) {
      mainSubscription = {
        id: String((row as { id: string }).id),
        status: formatLifecycleLabel(lifecycle),
        expiresAt: (row as { expires_at?: string | null }).expires_at ?? null,
        planName: String(embedded.name ?? ent.effectivePlan?.name ?? "Plan"),
        price: Number(embedded.price ?? 0),
      };
    }
  }

  const branchAddonItems: AdminPharmacyBranchAddonRow[] = [];
  for (const row of addonSubRows) {
    const lifecycle = normalizeLifecycleStatus(
      (row as { status?: string }).status,
      {
        is_active: (row as { is_active?: boolean }).is_active,
        payment_method: (row as { payment_method?: string }).payment_method,
      },
    );
    if (lifecycle !== "active" && lifecycle !== "pending_payment") continue;
    const plan = (row as {
      subscription_plans?: { name?: string; price?: unknown } | null;
    }).subscription_plans;
    const branch = (row as {
      branches?: { name?: string } | { name?: string }[] | null;
    }).branches;
    const branchName = Array.isArray(branch)
      ? branch[0]?.name
      : branch?.name;
    branchAddonItems.push({
      id: String((row as { id: string }).id),
      status: formatLifecycleLabel(lifecycle),
      branchName: branchName ? String(branchName) : null,
      planName: String(plan?.name ?? "Branch add-on"),
      price: Number(plan?.price ?? 0),
    });
  }

  let owner: AdminPharmacyDetail["owner"] = null;
  const ownerId = pharmacy.owner_id as string | null | undefined;
  if (ownerId) {
    const ownerName =
      (pharmacy.owner_name as string | undefined)?.trim() ||
      (pharmacy.owner_email as string | undefined)?.trim() ||
      null;
    const ownerEmail =
      (pharmacy.owner_email as string | undefined)?.trim() ||
      (pharmacy.email as string | undefined)?.trim() ||
      null;
    owner = { name: ownerName, email: ownerEmail };
    const userRow = await storeFindOwnerPublicUser(ownerId);
    if (userRow) {
      owner = {
        name:
          ownerName ||
          String(userRow.full_name ?? userRow.name ?? "").trim() ||
          null,
        email:
          ownerEmail || String(userRow.email ?? "").trim() || null,
      };
    }
  }

  const pendingPlan = pendingMainSubscription;
  const showPendingPlan =
    !ent.isAccessAllowed &&
    pendingPlan != null &&
    (ent.accessBlockReason === "pending_payment" ||
      ent.accessBlockReason === "no_subscription");

  const enrichedPlan = resolvePharmacyPlanDisplay(
    {
      subscription_plan: String(pharmacy.subscription_plan ?? ""),
      catalog_plan_name: showPendingPlan
        ? pendingPlan!.planName
        : ent.effectivePlan?.name ?? mainSubscription?.planName,
      catalog_plan_price: showPendingPlan
        ? pendingPlan!.price
        : mainSubscription?.price ?? ent.effectivePlan?.price ?? null,
      is_free_plan: showPendingPlan
        ? pendingPlan!.price <= 0
        : ent.effectivePlan
          ? Number(ent.effectivePlan.price) <= 0
          : null,
    },
    catalog,
  );

  const access =
    ent.isAccessAllowed
      ? { status: "active", label: "Active" }
      : pendingMainSubscription
        ? { status: "pending_payment", label: "Pending payment" }
        : { status: legacyAccessStatus, label: pharmacyAccessLabel(legacyAccessStatus) };

  return {
    pharmacy: pharmacy as Record<string, unknown>,
    owner,
    plan: {
      name: enrichedPlan.name,
      priceLabel: enrichedPlan.priceLabel,
      isFree: enrichedPlan.isFree,
      enumKey: String(pharmacy.subscription_plan ?? "trial"),
    },
    access,
    mainSubscription,
    pendingMainSubscription,
    branchAddons: {
      activeCount: branchAddonItems.length,
      items: branchAddonItems,
      catalogProductName: catalogAddon?.name ?? null,
      catalogProductPrice: catalogAddon?.price ?? null,
    },
    capacity: {
      branchesInUse: ent.usage.activeBranches,
      slotsFromMainPlan: Number(ent.effectivePlan?.max_branches ?? 1),
      slotsFromAddons: Math.max(
        0,
        ent.limits.totalBranchSlots -
          Number(ent.effectivePlan?.max_branches ?? 1),
      ),
      totalSlots: ent.limits.totalBranchSlots,
      canAddBranch:
        ent.usage.activeBranches < ent.limits.totalBranchSlots,
    },
    entitlements: {
      isAccessAllowed: ent.isAccessAllowed,
      isExpired: ent.isExpired,
      daysRemaining: ent.daysRemaining,
      expiresAt: ent.expiresAt,
      limits: ent.limits,
      usage: ent.usage,
      featureCount: ent.featureKeys.length,
    },
  };
}
