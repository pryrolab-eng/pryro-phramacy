"use client";

import { useQuery } from "@tanstack/react-query";
import { getMeWorkplace, meWorkplaceQueryKey } from "@/lib/http/me-workplace";

export function useMeWorkplace(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: meWorkplaceQueryKey,
    queryFn: getMeWorkplace,
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}
