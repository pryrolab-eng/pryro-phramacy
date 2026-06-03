"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  getMeContext,
  meContextKeys,
  setActiveBranch,
  setActivePharmacy,
  type MeContextResponse,
} from "@/lib/http/me-context";
import { ApiError } from "@/lib/http/client";

const EMPTY: MeContextResponse = {
  user: { id: "", email: null, fullName: null, isPlatformAdmin: false },
  activePharmacyId: null,
  activeBranchId: null,
  role: null,
  allowedBranchIds: null,
  permissions: [],
  mustChangePassword: false,
  memberships: [],
};

export function useActivePharmacyContext(options?: { enabled?: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: meContextKeys.all,
    queryFn: getMeContext,
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) {
        return failureCount < 3;
      }
      return failureCount < 1;
    },
    retryDelay: (attempt) => Math.min(400 * (attempt + 1), 1200),
  });

  const hasSnapshot = query.data !== undefined;
  const isHydrating = !hasSnapshot && !query.isError;

  const data = query.data ?? EMPTY;

  const branchRepairAttempted = useRef(false);

  /** Server auto-creates a default branch; refetch session once if still missing. */
  useEffect(() => {
    if (branchRepairAttempted.current || isHydrating) return;
    if (data.activePharmacyId && !data.activeBranchId) {
      branchRepairAttempted.current = true;
      void query.refetch();
    }
  }, [data.activePharmacyId, data.activeBranchId, isHydrating, query.refetch]);

  const invalidateTenantQueries = async () => {
    await queryClient.invalidateQueries();
    router.refresh();
  };

  const switchPharmacy = async (pharmacyId: string) => {
    await setActivePharmacy(pharmacyId);
    await invalidateTenantQueries();
  };

  const switchBranch = async (branchId: string) => {
    await setActiveBranch(branchId);
    await invalidateTenantQueries();
  };

  return {
    ...query,
    context: data,
    hasSnapshot,
    isHydrating,
    activePharmacyId: data.activePharmacyId,
    activeBranchId: data.activeBranchId,
    allowedBranchIds: data.allowedBranchIds ?? null,
    permissions: data.permissions ?? [],
    memberships: data.memberships,
    switchPharmacy,
    switchBranch,
  };
}
