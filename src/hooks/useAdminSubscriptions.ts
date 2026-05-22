'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  adminSubscriptionsQueryKey,
  getAdminSubscriptions,
  suspendAdminSubscription,
  reactivateAdminSubscription,
  type AdminSubscriberRow,
} from '@/lib/http/admin/subscriptions'

export { adminSubscriptionsQueryKey }
export type { AdminSubscriberRow }

// ─── Query ────────────────────────────────────────────────

export function useAdminSubscriptions(status?: string) {
  return useQuery<AdminSubscriberRow[]>({
    queryKey: [...adminSubscriptionsQueryKey, status ?? 'all'],
    queryFn: () => getAdminSubscriptions(status),
    staleTime: 30 * 1000,
  })
}

// ─── Suspend mutation ─────────────────────────────────────

export function useSuspendSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      suspendAdminSubscription(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminSubscriptionsQueryKey })
    },
  })
}

// ─── Reactivate mutation ──────────────────────────────────

export function useReactivateSubscription() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => reactivateAdminSubscription(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminSubscriptionsQueryKey })
    },
  })
}
