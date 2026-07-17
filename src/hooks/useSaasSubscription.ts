'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  cancelSaasSubscription,
  createSaasPlan,
  generateSaasInvoice,
  getAdminSaasSubscriptions,
  getSaasInvoices,
  getSaasPlans,
  getSaasSubscriptionSummary,
  saasKeys,
  subscribeToSaasPlan,
  updateSaasPlan,
  type SubscribeToSaasPlanInput,
} from '@/lib/http/saas'
import { invalidateAllPlanCaches } from '@/lib/query/invalidate-plan-caches'
import {
  createSaasBranch,
  getSaasBranches,
  type CreateSaasBranchInput,
} from '@/lib/http/saas-branches'
import { SEARCH_LIST_STALE_MS } from '@/lib/search/constants'
import type {
  PharmacySubscriptionSummary,
  SubscriptionInvoice,
  SubscriptionPlan,
} from '@/lib/saas/types'

export { saasKeys } from '@/lib/http/saas'

export function useSaasPlans() {
  return useQuery<SubscriptionPlan[]>({
    queryKey: saasKeys.plans(),
    queryFn: getSaasPlans,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  })
}

export function useSaasSubscription() {
  return useQuery<PharmacySubscriptionSummary>({
    queryKey: saasKeys.subscription(),
    queryFn: getSaasSubscriptionSummary,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  })
}

export function useSubscribeToPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: SubscribeToSaasPlanInput) => subscribeToSaasPlan(params),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: saasKeys.subscription() })
      void qc.invalidateQueries({ queryKey: saasKeys.branches() })
    },
  })
}

export function useCancelSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (subscriptionId: string) => cancelSaasSubscription(subscriptionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: saasKeys.subscription() })
    },
  })
}

export function useSaasBranches(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: saasKeys.branches(),
    queryFn: async () => {
      const data = await getSaasBranches()
      return data.branches
    },
    enabled: options?.enabled ?? true,
    staleTime: SEARCH_LIST_STALE_MS,
    refetchOnWindowFocus: true,
  })
}

export function useCreateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (params: CreateSaasBranchInput) => createSaasBranch(params),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: saasKeys.branches() })
      void qc.invalidateQueries({ queryKey: saasKeys.subscription() })
    },
  })
}

export function useSaasInvoices(month?: string) {
  return useQuery<SubscriptionInvoice[]>({
    queryKey: saasKeys.invoices(month),
    queryFn: () => getSaasInvoices(month),
    staleTime: 60 * 1000,
  })
}

export function useGenerateSaasInvoiceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (month?: string) => generateSaasInvoice(month),
    onSuccess: (_data, month) => {
      void qc.invalidateQueries({ queryKey: saasKeys.invoices(month) })
      void qc.invalidateQueries({ queryKey: saasKeys.invoices() })
    },
  })
}

export function useAdminSaasSubscriptions(status?: string) {
  return useQuery({
    queryKey: saasKeys.adminSubscriptions(status),
    queryFn: () => getAdminSaasSubscriptions(status),
    staleTime: 30 * 1000,
  })
}

export function useCreateSaasPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSaasPlan,
    onSuccess: () => {
      void invalidateAllPlanCaches(qc)
    },
  })
}

export function useUpdateSaasPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      planId,
      updates,
    }: {
      planId: string
      updates: Record<string, unknown>
    }) => updateSaasPlan(planId, updates),
    onSuccess: () => {
      void invalidateAllPlanCaches(qc)
    },
  })
}
