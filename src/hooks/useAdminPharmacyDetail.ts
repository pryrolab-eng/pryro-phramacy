"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAdminPharmacyDetail,
  type AdminPharmacyDetailPayload,
} from "@/lib/http/admin/pharmacies";
import { adminDetailQueryDefaults } from "@/lib/query/admin-query-options";

export const adminPharmacyDetailQueryKey = (id: string) =>
  ["admin", "pharmacies", id, "detail"] as const;

/** Call only when `pharmacyId` is non-empty (e.g. detail panel mounted while dialog is open). */
export function useAdminPharmacyDetail(pharmacyId: string) {
  return useQuery({
    ...adminDetailQueryDefaults,
    queryKey: adminPharmacyDetailQueryKey(pharmacyId),
    queryFn: () => getAdminPharmacyDetail(pharmacyId),
    retry: 1,
  });
}

export type { AdminPharmacyDetailPayload };
