import {
  storeResolveGlobalInsuranceProvider,
  storeResolveInsuranceProvider,
} from "@/lib/db/insurance-store";

/** Resolve provider by UUID or display name (global or pharmacy-scoped). */
export async function resolveInsuranceProvider(
  pharmacyId: string,
  providerIdOrName: string,
): Promise<{
  id: string;
  name: string;
  coveragePercent: number;
  integrationType: string;
} | null> {
  return storeResolveInsuranceProvider(pharmacyId, providerIdOrName);
}

/** Platform admin: resolve a global insurer (pharmacy_id is null). */
export async function resolveGlobalInsuranceProvider(
  providerIdOrName: string,
): Promise<{
  id: string;
  name: string;
  coveragePercent: number;
  integrationType: string;
} | null> {
  return storeResolveGlobalInsuranceProvider(providerIdOrName);
}
