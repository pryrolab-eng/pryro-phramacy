"use client";

import { adminPlansQueryKey, getAdminPlans } from "@/lib/http/admin/plans";
import { useQuery } from "@tanstack/react-query";
import { adminListQueryDefaults } from "@/lib/query/admin-query-options";

export { adminPlansQueryKey } from "@/lib/http/admin/plans";

export function useAdminPlans(options?: { enabled?: boolean }) {
  return useQuery({
    ...adminListQueryDefaults,
    queryKey: adminPlansQueryKey,
    queryFn: getAdminPlans,
    enabled: options?.enabled ?? true,
  });
}
