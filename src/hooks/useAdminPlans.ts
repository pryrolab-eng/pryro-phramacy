"use client";

import { adminPlansQueryKey, getAdminPlans } from "@/lib/http/admin/plans";
import { useQuery } from "@tanstack/react-query";

export { adminPlansQueryKey } from "@/lib/http/admin/plans";

export function useAdminPlans(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminPlansQueryKey,
    queryFn: getAdminPlans,
    enabled: options?.enabled ?? true,
  });
}
