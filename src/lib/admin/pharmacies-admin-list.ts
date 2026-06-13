import {
  resolveAdminPharmacyListFields,
  type AdminMainSubRow,
} from "@/lib/admin/pharmacy-list-enrichment";
import { isFreePlanPrice } from "@/lib/admin/plan-stats";
import { planNameToEnum } from "@/lib/subscription/plan-enum";
import {
  isBranchAddonCatalogName,
  isMainTierCatalogRow,
} from "@/lib/subscription/normalize-plan";
import {
  storeListActiveMainCatalogPlans,
  storeListBranchAddonPharmacyIds,
  storeListMainSubsForAdminPharmacyList,
  storeListPharmaciesForAdmin,
} from "@/lib/db/admin-store";

export async function buildAdminPharmaciesList() {
  const [pharmacies, mainSubs, branchAddonPharmacyIds, mainCatalogPlans] =
    await Promise.all([
      storeListPharmaciesForAdmin(),
      storeListMainSubsForAdminPharmacyList(),
      storeListBranchAddonPharmacyIds(),
      storeListActiveMainCatalogPlans(),
    ]);

  const branchAddonCountByPharmacy = new Map<string, number>();
  for (const pharmacyId of branchAddonPharmacyIds) {
    branchAddonCountByPharmacy.set(
      pharmacyId,
      (branchAddonCountByPharmacy.get(pharmacyId) ?? 0) + 1,
    );
  }

  const mainSubsByPharmacy = new Map<string, AdminMainSubRow[]>();
  for (const row of mainSubs) {
    const list = mainSubsByPharmacy.get(row.pharmacy_id) ?? [];
    list.push(row);
    mainSubsByPharmacy.set(row.pharmacy_id, list);
  }

  const priceByCatalogName = new Map<string, number>();
  for (const row of mainCatalogPlans) {
    const n = String(row.name ?? "").trim().toLowerCase();
    if (n) {
      priceByCatalogName.set(n, Number(row.price ?? 0));
    }
  }

  return pharmacies.map((p) => {
    const id = String((p as { id?: string }).id ?? "");
    const mainSubsForPharmacy = mainSubsByPharmacy.get(id) ?? [];
    const listFields = resolveAdminPharmacyListFields(
      {
        status: (p as { status?: string }).status,
        subscription_plan: (p as { subscription_plan?: string }).subscription_plan,
      },
      mainSubsForPharmacy,
      mainCatalogPlans,
    );

    const enumKey = planNameToEnum(
      String((p as { subscription_plan?: string }).subscription_plan ?? ""),
    );
    const fallbackPlan = mainCatalogPlans.find(
      (c) => planNameToEnum(String(c.name)) === enumKey,
    );

    let catalog_plan_name = listFields.catalog_plan_name;
    let catalog_plan_price = listFields.catalog_plan_price;
    if (!catalog_plan_name) {
      catalog_plan_name = fallbackPlan?.name ? String(fallbackPlan.name) : null;
      if (catalog_plan_name && isBranchAddonCatalogName(catalog_plan_name)) {
        catalog_plan_name = null;
      }
    }
    if (catalog_plan_price == null && catalog_plan_name) {
      catalog_plan_price =
        priceByCatalogName.get(catalog_plan_name.toLowerCase()) ?? null;
    }

    const is_free_plan =
      catalog_plan_price != null
        ? isFreePlanPrice(catalog_plan_price)
        : enumKey === "trial";

    return {
      ...p,
      status: listFields.status,
      access_status: listFields.access_status,
      access_label: listFields.access_label,
      branch_addons_active: branchAddonCountByPharmacy.get(id) ?? 0,
      subscription_expires_at: listFields.subscription_expires_at,
      pending_plan_name: listFields.pending_plan_name,
      ...(catalog_plan_name
        ? { catalog_plan_name, catalog_plan_price, is_free_plan }
        : { is_free_plan: enumKey === "trial" }),
    };
  });
}
