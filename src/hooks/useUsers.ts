"use client";

import { getStaffUsers, staffUsersQueryKey } from "@/lib/http/staff";
import { useQuery } from "@tanstack/react-query";

export type { StaffUser } from "@/lib/http/staff";
export { staffUsersQueryKey } from "@/lib/http/staff";

/**
 * Pharmacy staff for the current tenant (backed by `GET /api/staff`).
 * Superadmin / cross-tenant user lists can be a separate hook + route later.
 */
export function useUsers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: staffUsersQueryKey,
    queryFn: getStaffUsers,
    enabled: options?.enabled ?? true,
  });
}
