import type { QueryClient } from "@tanstack/react-query";
import { adminBillingQueryKey } from "@/lib/http/admin/billing";
import { adminPlansQueryKey } from "@/lib/http/admin/plans";
import { adminReportsSummaryQueryKey } from "@/lib/http/admin/reports";
import { entitlementsKeys } from "@/lib/http/entitlements";
import { plansKeys } from "@/lib/http/plans";
import { pharmacySettingsKeys } from "@/lib/http/pharmacy-settings";
import { saasKeys } from "@/lib/http/saas";
import { subscriptionKeys } from "@/lib/http/subscription";

/** Admin surfaces that list or bill against subscription plans. */
export async function invalidateAdminPlanCaches(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminPlansQueryKey }),
    queryClient.invalidateQueries({ queryKey: adminBillingQueryKey }),
    queryClient.invalidateQueries({ queryKey: adminReportsSummaryQueryKey }),
  ]);
}

/** Pharmacy billing, entitlements, upgrade catalog, and settings plan labels. */
export async function invalidatePharmacyPlanCaches(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: plansKeys.all }),
    queryClient.invalidateQueries({ queryKey: entitlementsKeys.all }),
    queryClient.invalidateQueries({ queryKey: saasKeys.all }),
    queryClient.invalidateQueries({ queryKey: subscriptionKeys.all }),
    queryClient.invalidateQueries({ queryKey: pharmacySettingsKeys.info() }),
  ]);
}

/** Call after admin creates or edits subscription plans. */
export async function invalidateAllPlanCaches(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all([
    invalidateAdminPlanCaches(queryClient),
    invalidatePharmacyPlanCaches(queryClient),
  ]);
}
