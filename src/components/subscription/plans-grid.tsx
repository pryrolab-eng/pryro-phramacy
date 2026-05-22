'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { BillingToggle } from './billing-toggle'
import { PlanCard } from './plan-card'
import type { SubscriptionPlan } from '@/lib/saas/types'

// ─── Props ────────────────────────────────────────────────

export interface PlansGridProps {
  plans: SubscriptionPlan[]
  currentPlanId?: string | null
  isLoading?: boolean
  isError?: boolean
  pendingPlanId?: string | null
  onSelect: (plan: SubscriptionPlan, cycle: 'monthly' | 'yearly') => void
  onRetry?: () => void
  /** Initial billing cycle — defaults to monthly */
  defaultCycle?: 'monthly' | 'yearly'
}

// ─── Component ────────────────────────────────────────────

export function PlansGrid({
  plans,
  currentPlanId,
  isLoading,
  isError,
  pendingPlanId,
  onSelect,
  onRetry,
  defaultCycle = 'monthly',
}: PlansGridProps) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>(defaultCycle)

  // Find the max discount % across all plans for the toggle hint
  const maxDiscount = plans.reduce((max, p) => Math.max(max, p.yearly_discount_pct ?? 0), 0)

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-sm text-destructive">Could not load plans. Please try again.</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-16">
        No subscription plans available yet.
      </p>
    )
  }

  return (
    <div className="space-y-8">
      {/* Billing toggle — centred */}
      <div className="flex justify-center">
        <BillingToggle value={cycle} onChange={setCycle} discountPct={maxDiscount} />
      </div>

      {/* Plan cards grid */}
      <div className={`grid gap-6 ${plans.length === 1 ? 'max-w-sm mx-auto' : plans.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' : 'grid-cols-1 md:grid-cols-3'}`}>
        {plans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billingCycle={cycle}
            isCurrent={plan.id === currentPlanId}
            isPending={pendingPlanId === plan.id}
            onSelect={p => onSelect(p, cycle)}
          />
        ))}
      </div>
    </div>
  )
}
