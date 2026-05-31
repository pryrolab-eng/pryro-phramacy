"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getStaffDashboardSummary,
  meStaffDashboardQueryKey,
} from "@/lib/http/me-staff-dashboard";

export function useMeStaffDashboard(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: meStaffDashboardQueryKey,
    queryFn: getStaffDashboardSummary,
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
}
