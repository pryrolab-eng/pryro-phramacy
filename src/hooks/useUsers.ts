"use client";

import {
  deleteStaffMember,
  getStaffUsers,
  resendStaffInvite,
  staffUsersQueryKey,
  updateStaffMember,
  type StaffUpdatePayload,
} from "@/lib/http/staff";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SEARCH_LIST_STALE_MS } from "@/lib/search/constants";

export type { StaffUser, StaffUpdatePayload } from "@/lib/http/staff";
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
    staleTime: SEARCH_LIST_STALE_MS,
  });
}

export function useUpdateStaffMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: StaffUpdatePayload }) =>
      updateStaffMember(id, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: staffUsersQueryKey }),
  });
}

export function useDeleteStaffMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStaffMember,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: staffUsersQueryKey }),
  });
}

export function useResendStaffInviteMutation() {
  return useMutation({
    mutationFn: resendStaffInvite,
  });
}
