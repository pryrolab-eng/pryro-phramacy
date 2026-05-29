"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pharmacyCategoriesCatalogQueryKey } from "@/lib/http/catalog";
import { getPharmacyCategoriesCatalog } from "@/lib/http/catalog";
import { customersKeys, searchCustomers } from "@/lib/http/customers";
import {
  getInsurancePricing,
  insurancePosKeys,
  lookupInsurance,
  processInsuranceClaim,
  type InsuranceProcessPayload,
} from "@/lib/http/insurance";
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

export function useInsurancePricing(
  insurance: string,
  product: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: insurancePosKeys.pricing(insurance, product),
    queryFn: () => getInsurancePricing(insurance, product),
    enabled: (options?.enabled ?? true) && !!insurance && !!product,
  });
}

export function useProcessPosSaleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PosSalePayload) => processPosSale(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: posKeys.products() });
      void queryClient.invalidateQueries({ queryKey: posKeys.fastMoving() });
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

export function useOpenCashierShiftMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: openCashierShift,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: posKeys.shift(variables.branchId),
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
    },
  });
}

export type { PosReturnPayload, PosSaleLookup, CashierShift };

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

/** Fetch insurance pricing for cart line (imperative, used when adding to cart). */
export { getInsurancePricing };
