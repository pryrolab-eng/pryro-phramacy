"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pharmacyCategoriesCatalogQueryKey } from "@/lib/http/catalog";
import { getPharmacyCategoriesCatalog } from "@/lib/http/catalog";
import { customersKeys, searchCustomers } from "@/lib/http/customers";
import {
  lookupInsurance,
  processInsuranceClaim,
  type InsuranceProcessPayload,
} from "@/lib/http/insurance";
import {
  previewInsuranceCoverage,
  type InsuranceCoveragePreviewResult,
} from "@/lib/http/insurance-coverage";
import {
  analyzeCartSafety,
  checkPosPrice,
  getPosFastMovingProducts,
  getPosProducts,
  holdPosSale,
  lookupPosCustomerByPhone,
  posKeys,
  processPosReturn,
  lookupPosSale,
  getCurrentCashierShift,
  getTeamOpenCashierShifts,
  openCashierShift,
  closeCashierShift,
  processPosSale,
  quickAddPosEntity,
  quickAddPosPatient,
  voidPosSale,
  type PosCartItem,
  type PosCustomer,
  type PosQuickAddEndpoint,
  type PosSalePayload,
  type PosReturnPayload,
  type PosSaleLookup,
  type CashierShift,
  type TeamOpenCashierShift,
} from "@/lib/http/pos";
import {
  checkBranchTransactionAllowed,
  getSaasBranches,
  incrementBranchTransactionCount,
  saasBranchesKeys,
} from "@/lib/http/saas-branches";

export {
  posKeys,
  type PosCartItem,
  type PosCustomer,
  type PosProduct,
  type PosSalePayload,
  type PrescriptionConfirmation,
} from "@/lib/http/pos";

export function usePosProducts(options?: {
  enabled?: boolean;
  branchId?: string | null;
}) {
  const branchId = options?.branchId;
  return useQuery({
    queryKey: posKeys.products(branchId),
    queryFn: () => getPosProducts(branchId),
    enabled: (options?.enabled ?? true) && Boolean(branchId),
  });
}

export function usePosFastMoving(options?: {
  enabled?: boolean;
  branchId?: string | null;
}) {
  const branchId = options?.branchId;
  return useQuery({
    queryKey: posKeys.fastMoving(branchId),
    queryFn: () => getPosFastMovingProducts(branchId),
    enabled: (options?.enabled ?? true) && Boolean(branchId),
  });
}

export function usePosCategories(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: pharmacyCategoriesCatalogQueryKey,
    queryFn: getPharmacyCategoriesCatalog,
    enabled: options?.enabled ?? true,
  });
}

export function useCustomerSearch(query: string) {
  return useQuery({
    queryKey: customersKeys.search(query),
    queryFn: () => searchCustomers(query),
    enabled: query.trim().length >= 2,
  });
}

export function useSaasBranches(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: saasBranchesKeys.list(),
    queryFn: getSaasBranches,
    enabled: options?.enabled ?? true,
  });
}

export function useProcessPosSaleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PosSalePayload) => processPosSale(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...posKeys.all, "products"],
      });
      void queryClient.invalidateQueries({
        queryKey: [...posKeys.all, "fast-moving"],
      });
    },
  });
}

export function useHoldPosSaleMutation() {
  return useMutation({
    mutationFn: holdPosSale,
  });
}

export function useVoidPosSaleMutation() {
  return useMutation({
    mutationFn: voidPosSale,
  });
}

export function usePosCustomerLookupMutation() {
  return useMutation({
    mutationFn: (phone: string) => lookupPosCustomerByPhone(phone),
  });
}

export function usePosPriceCheckMutation() {
  return useMutation({
    mutationFn: (query: string) => checkPosPrice(query),
  });
}

export function useQuickAddPosPatientMutation() {
  return useMutation({
    mutationFn: quickAddPosPatient,
  });
}

export function useQuickAddPosEntityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      endpoint,
      body,
    }: {
      endpoint: PosQuickAddEndpoint;
      body: Record<string, FormDataEntryValue>;
    }) => quickAddPosEntity(endpoint, body),
    onSuccess: (_data, variables) => {
      if (variables.endpoint === "/api/pos/quick-add-category") {
        void queryClient.invalidateQueries({
          queryKey: pharmacyCategoriesCatalogQueryKey,
        });
      }
      if (variables.endpoint === "/api/pos/quick-add-drug") {
        void queryClient.invalidateQueries({
          queryKey: [...posKeys.all, "products"],
        });
        void queryClient.invalidateQueries({
          queryKey: [...posKeys.all, "fast-moving"],
        });
      }
    },
  });
}

export function useProcessPosReturnMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PosReturnPayload) => processPosReturn(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: posKeys.all });
    },
  });
}

export function useLookupPosSaleMutation() {
  return useMutation({
    mutationFn: lookupPosSale,
  });
}

export function useCashierShift(branchId: string | null) {
  return useQuery({
    queryKey: posKeys.shift(branchId),
    queryFn: () => getCurrentCashierShift(branchId!),
    enabled: Boolean(branchId),
    refetchInterval: 60_000,
  });
}

export function useTeamOpenCashierShifts(
  branchId: string | null,
  enabled = false,
) {
  return useQuery({
    queryKey: posKeys.teamOpenShifts(branchId),
    queryFn: () => getTeamOpenCashierShifts(branchId!),
    enabled: Boolean(branchId) && enabled,
    refetchInterval: 60_000,
  });
}

export function useOpenCashierShiftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: openCashierShift,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: posKeys.shift(variables.branchId),
      });
      void queryClient.invalidateQueries({
        queryKey: posKeys.teamOpenShifts(variables.branchId),
      });
    },
  });
}

export function useCloseCashierShiftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: closeCashierShift,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: posKeys.shift(variables.branchId),
      });
      void queryClient.invalidateQueries({
        queryKey: posKeys.teamOpenShifts(variables.branchId),
      });
    },
  });
}

export type {
  PosReturnPayload,
  PosSaleLookup,
  CashierShift,
  TeamOpenCashierShift,
};

export function useAnalyzeCartSafetyMutation() {
  return useMutation({
    mutationFn: (items: PosCartItem[]) => analyzeCartSafety(items),
  });
}

export function useInsuranceLookupMutation() {
  return useMutation({
    mutationFn: (insuranceNumber: string) => lookupInsurance(insuranceNumber),
  });
}

export function useInsuranceProcessMutation() {
  return useMutation({
    mutationFn: (payload: InsuranceProcessPayload) =>
      processInsuranceClaim(payload),
  });
}

export function useInsuranceCoveragePreview(
  insuranceType: string,
  lines: Array<{
    inventoryId?: string;
    medicationId: string;
    medicationName?: string;
    quantity: number;
    shelfUnitPrice: number;
  }>,
  options?: { enabled?: boolean },
) {
  const lineKey = lines
    .map((l) => `${l.medicationId}:${l.quantity}:${l.shelfUnitPrice}`)
    .join("|");
  return useQuery({
    queryKey: ["insurance", "coverage-preview", insuranceType, lineKey],
    queryFn: () =>
      previewInsuranceCoverage({
        insuranceType,
        lines,
      }),
    enabled:
      (options?.enabled ?? true) &&
      Boolean(insuranceType) &&
      insuranceType !== "cash" &&
      lines.length > 0,
    staleTime: 10_000,
  });
}

export type { InsuranceCoveragePreviewResult };

/** Imperative usage gate before sale (fail-closed on errors). */
export async function checkPosTransactionAllowed(
  branchId: string | null,
): Promise<{ allowed: boolean; reason?: string; message?: string }> {
  if (!branchId) {
    return {
      allowed: false,
      reason: "no_branch",
      message: "Select a branch before completing a sale.",
    };
  }
  try {
    const data = await checkBranchTransactionAllowed(branchId);
    if (!data.allowed) {
      return {
        allowed: false,
        reason: data.reason ?? "limit_reached",
        message:
          data.message ?? "Transaction limit reached for this branch.",
      };
    }
    return { allowed: true };
  } catch {
    return {
      allowed: false,
      reason: "check_failed",
      message: "Could not verify branch transaction allowance.",
    };
  }
}

export function useIncrementBranchUsageMutation() {
  return useMutation({
    mutationFn: (branchId: string) =>
      incrementBranchTransactionCount(branchId),
  });
}

