"use client";

import { useQuery } from "@tanstack/react-query";
import { getSubscriptionPlans, plansKeys } from "@/lib/http/plans";

export { plansKeys } from "@/lib/http/plans";

/** Public marketing plans (`plan_type === main`). */
export function usePublicMainPlans(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...plansKeys.catalog(), "main"] as const,
    queryFn: async () => {
      const list = await getSubscriptionPlans();
      return list.filter((p) => (p.plan_type ?? "main") === "main");
    },
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}
