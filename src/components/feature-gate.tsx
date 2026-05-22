'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Lock, CreditCard, CheckCircle, ArrowRight, Crown,
  GitBranch, Users, Activity,
} from 'lucide-react'
import { useSaasSubscription, useSaasPlans } from '@/hooks/useSaasSubscription'
import { planGrantsFeature, FEATURE_LABELS } from '@/lib/saas/feature-access'
import type { FeatureKey } from '@/lib/saas/feature-access'
import type { SubscriptionPlan } from '@/lib/saas/types'

// ─── Props ────────────────────────────────────────────────

interface FeatureGateProps {
  /** The feature key to check */
  feature: FeatureKey
  /** Content to render when access is granted */
  children: React.ReactNode
  /** Optional: render a custom fallback instead of the default upgrade modal trigger */
  fallback?: React.ReactNode
}

// ─── Upgrade Modal ────────────────────────────────────────

function UpgradeModal({
  open,
  onClose,
  featureLabel,
  plans,
  currentPlanId,
}: {
  open: boolean
  onClose: () => void
  featureLabel: string
  plans: SubscriptionPlan[]
  currentPlanId?: string
}) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Upgrade Required</DialogTitle>
              <DialogDescription>
                <strong>{featureLabel}</strong> is not included in your current plan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose a plan that includes <strong>{featureLabel}</strong> to unlock this feature.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plans
              .filter(p => p.plan_type === 'main' && p.is_active && p.id !== currentPlanId)
              .map(plan => (
                <Card
                  key={plan.id}
                  className={`relative cursor-pointer hover:border-blue-400 transition-colors ${plan.is_popular ? 'border-2 border-blue-500' : ''}`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white text-[10px] px-2">
                        <Crown className="h-2.5 w-2.5 mr-1" />
                        Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="pt-4 pb-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">{plan.name}</span>
                      <span className="text-sm font-bold text-blue-600">
                        {plan.price === 0 ? 'Free' : `RWF ${Number(plan.price).toLocaleString()}`}
                        {plan.price > 0 && (
                          <span className="text-xs font-normal text-muted-foreground">/{plan.billing_period}</span>
                        )}
                      </span>
                    </div>

                    {/* Limits */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        {plan.max_branches} branches
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {plan.max_users} users
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" />
                        {plan.monthly_tx_limit.toLocaleString()} tx/mo
                      </span>
                    </div>

                    {/* Features */}
                    <ul className="space-y-0.5">
                      {plan.features.slice(0, 4).map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                      {plan.features.length > 4 && (
                        <li className="text-xs text-muted-foreground pl-4">
                          +{plan.features.length - 4} more
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>
              Maybe later
            </Button>
            <Button
              onClick={() => {
                onClose()
                router.push('/pharmacy-dashboard/billing?tab=upgrade')
              }}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              View All Plans
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── FeatureGate ──────────────────────────────────────────

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const subQuery = useSaasSubscription()
  const plansQuery = useSaasPlans()

  const summary = subQuery.data
  const plans = plansQuery.data ?? []

  // While loading, render children (optimistic — avoids flash of locked state)
  if (subQuery.isPending) return <>{children}</>

  // No subscription at all → SubscriptionBlocker handles the full block
  // FeatureGate only handles feature-level locks within an active subscription
  if (!summary?.main_subscription) return <>{children}</>

  const planFeatures = summary.main_subscription.plan?.features ?? []
  const hasAccess = planGrantsFeature(planFeatures, feature)

  if (hasAccess) return <>{children}</>

  const featureLabel = FEATURE_LABELS[feature] ?? feature

  // Custom fallback provided
  if (fallback) {
    return (
      <>
        <div onClick={() => setModalOpen(true)} className="cursor-pointer">
          {fallback}
        </div>
        <UpgradeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          featureLabel={featureLabel}
          plans={plans}
          currentPlanId={summary.main_subscription.plan_id}
        />
      </>
    )
  }

  // Default: render children wrapped in a locked overlay
  return (
    <>
      <div className="relative">
        {/* Blurred content */}
        <div className="pointer-events-none select-none blur-sm opacity-40">
          {children}
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
          <div className="text-center space-y-3 p-6">
            <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">{featureLabel}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Not included in your current plan
              </p>
            </div>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Crown className="h-3.5 w-3.5 mr-1.5" />
              Upgrade to Unlock
            </Button>
          </div>
        </div>
      </div>

      <UpgradeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        featureLabel={featureLabel}
        plans={plans}
        currentPlanId={summary.main_subscription.plan_id}
      />
    </>
  )
}

// ─── useFeatureAccess hook ────────────────────────────────
// For programmatic checks (e.g. hiding nav items, disabling buttons)

export function useFeatureAccess(feature: FeatureKey): {
  allowed: boolean
  loading: boolean
  planName?: string
} {
  const subQuery = useSaasSubscription()
  const summary = subQuery.data

  if (subQuery.isPending) return { allowed: true, loading: true }
  if (!summary?.main_subscription) return { allowed: false, loading: false }

  const planFeatures = summary.main_subscription.plan?.features ?? []
  const allowed = planGrantsFeature(planFeatures, feature)

  return {
    allowed,
    loading: false,
    planName: summary.main_subscription.plan?.name,
  }
}
