'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  PharmacySubscriptionSummary,
  SubscriptionPlan,
  SubscriptionInvoice,
  SubscriptionType,
} from '@/lib/saas/types'

// ─── Query keys ────────────────────────────────────────────
export const saasKeys = {
  plans: ['saas', 'plans'] as const,
  subscription: ['saas', 'subscription'] as const,
  branches: ['saas', 'branches'] as const,
  invoices: (month?: string) => ['saas', 'invoices', month] as const,
  adminSubscriptions: (status?: string) => ['saas', 'admin', 'subscriptions', status] as const,
}

// ─── Plans ─────────────────────────────────────────────────
export function useSaasPlans() {
  return useQuery<SubscriptionPlan[]>({
    queryKey: saasKeys.plans,
    queryFn: async () => {
      const res = await fetch('/api/saas/plans')
      if (!res.ok) throw new Error('Failed to load plans')
      const data = await res.json()
      return data.plans
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Subscription summary ──────────────────────────────────
export function useSaasSubscription() {
  return useQuery<PharmacySubscriptionSummary>({
    queryKey: saasKeys.subscription,
    queryFn: async () => {
      const res = await fetch('/api/saas/subscription')
      if (!res.ok) throw new Error('Failed to load subscription')
      const data = await res.json()
      return data.summary
    },
    staleTime: 30 * 1000,
  })
}

// ─── Subscribe mutation ────────────────────────────────────
export function useSubscribeToPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      plan_id: string
      subscription_type?: SubscriptionType
      branch_id?: string
      billing_cycle?: 'monthly' | 'yearly'
    }) => {
      const res = await fetch('/api/saas/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Subscription failed')
      return data.subscription
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: saasKeys.subscription })
      void qc.invalidateQueries({ queryKey: saasKeys.branches })
    },
  })
}

// ─── Cancel subscription mutation ─────────────────────────
export function useCancelSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const res = await fetch('/api/saas/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cancel failed')
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: saasKeys.subscription })
    },
  })
}

// ─── Branches ──────────────────────────────────────────────
export function useSaasBranches() {
  return useQuery({
    queryKey: saasKeys.branches,
    queryFn: async () => {
      const res = await fetch('/api/saas/branches')
      if (!res.ok) throw new Error('Failed to load branches')
      const data = await res.json()
      return data.branches
    },
    staleTime: 30 * 1000,
  })
}

export function useCreateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      name: string
      address?: string
      phone?: string
      email?: string
    }) => {
      const res = await fetch('/api/saas/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create branch')
      return data.branch
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: saasKeys.branches })
      void qc.invalidateQueries({ queryKey: saasKeys.subscription })
    },
  })
}

// ─── Invoices ──────────────────────────────────────────────
export function useSaasInvoices(month?: string) {
  return useQuery<SubscriptionInvoice[]>({
    queryKey: saasKeys.invoices(month),
    queryFn: async () => {
      const url = month ? `/api/saas/invoice?month=${month}` : '/api/saas/invoice'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load invoices')
      const data = await res.json()
      return data.invoices
    },
    staleTime: 60 * 1000,
  })
}

// ─── Admin: all subscriptions ──────────────────────────────
export function useAdminSaasSubscriptions(status?: string) {
  return useQuery({
    queryKey: saasKeys.adminSubscriptions(status),
    queryFn: async () => {
      const url = status
        ? `/api/saas/admin/subscriptions?status=${status}`
        : '/api/saas/admin/subscriptions'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load subscriptions')
      const data = await res.json()
      return data.subscriptions
    },
    staleTime: 30 * 1000,
  })
}

// ─── Admin: create plan ────────────────────────────────────
export function useCreateSaasPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (params: {
      name: string
      price: number
      billing_period: string
      plan_type: string
      max_branches: number
      max_users: number
      monthly_tx_limit: number
      features: string[]
      is_popular?: boolean
    }) => {
      const res = await fetch('/api/saas/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create plan')
      return data.plan
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: saasKeys.plans })
    },
  })
}

// ─── Admin: update plan ────────────────────────────────────
export function useUpdateSaasPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ planId, updates }: { planId: string; updates: Record<string, unknown> }) => {
      const res = await fetch(`/api/saas/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update plan')
      return data.plan
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: saasKeys.plans })
    },
  })
}

// ─── Admin: suspend / reactivate subscription ─────────────
export function useAdminSubscriptionAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      subscriptionId,
      action,
      reason,
    }: {
      subscriptionId: string
      action: 'suspend' | 'reactivate'
      reason?: string
    }) => {
      const res = await fetch(`/api/saas/admin/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: saasKeys.adminSubscriptions() })
    },
  })
}
