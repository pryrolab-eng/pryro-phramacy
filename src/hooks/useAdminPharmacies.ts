"use client";

import {
  adminPharmaciesQueryKey,
  getAdminPharmacies,
} from "@/lib/http/admin/pharmacies";
import { useQuery } from "@tanstack/react-query";

export { adminPharmaciesQueryKey } from "@/lib/http/admin/pharmacies";

export function useAdminPharmacies(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminPharmaciesQueryKey,
    queryFn: getAdminPharmacies,
    enabled: options?.enabled ?? true,
  });
}
