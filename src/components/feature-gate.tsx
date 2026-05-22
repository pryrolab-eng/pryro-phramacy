'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Lock, Crown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  useSaasSubscription, useSaasPlans, useSubscribeToPlan,
} from '@/hooks/useSaasSubscription'
import { planGrantsFeature, FEATURE_LABELS } from '@/lib/saas/feature-access'
import type { FeatureKey } from '@/lib/saas/feature-access'
import type { SubscriptionPlan } from '@/lib/saas/types'
import { PlansGrid } from '@/components/subscription'

// ─── Props ────────────────────────────────────────────────

interface FeatureGateProps {
  feature: FeatureKey
  children: React.ReactNode
  fallback?: React.ReactNode
}

// ─── Upgrade Modal ────────────────────────────────────────
// Uses the same PlansGrid + PlanCard as the landing page and
// the pharmacy billing page — one design everywhere.

function UpgradeModal({
  open,
  onClose,
  featureLabel,
  plans,
  isLoadingPlans,
  isPlansError,
  onRetryPlans,
  currentPlanId,
}: {
  open: boolean
  onClose: () => void
  featureLabel: string
  plans: SubscriptionPlan[]
  isLoadingPlans: boolean
  isPlansError: boolean
  onRetryPlans: () => void
  currentPlanId?: string | null
}) {
  const subscribe = useSubscribeToPlan()
  const [upgradeTarget, setUpgradeTarget] = useState<{
    plan: SubscriptionPlan
    cycle: 'monthly' | 'yearly'
  } | null>(null)
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null)

  const handleSubscribe = async () => {
    if (!upgradeTarget) return
    const { plan, cycle } = upgradeTarget
    setPendingPlanId(plan.id)
    const tid = toast.loading(`Subscribing to ${plan.name}…`)
    try {
      await subscribe.mutateAsync({
        plan_id: plan.id,
        subscription_type: 'main',
        billing_cycle: cycle,
      })
      setUpgradeTarget(null)
      onClose()
      toast.success(`Subscribed to ${plan.name}`, {
        id: tid,
        description: `Billing cycle: ${cycle}`,
      })
    } catch (err) {
      toast.error('Subscription failed', {
        id: tid,
        description: err instanceof Error ? err.message : 'Could not subscribe',
      })
    } finally {
      setPendingPlanId(null)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={o => !o && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-xl">Upgrade Required</DialogTitle>
                <DialogDescription>
                  <strong>{featureLabel}</strong> is not included in your current plan.
                  Choose a plan below to unlock it.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Same PlansGrid as landing page and billing page */}
          <PlansGrid
            plans={plans}
            currentPlanId={currentPlanId}
            isLoading={isLoadingPlans}
            isError={isPlansError}
            pendingPlanId={pendingPlanId}
            onSelect={(plan, cycle) => setUpgradeTarget({ plan, cycle })}
            onRetry={onRetryPlans}
          />
        </DialogContent>
      </Dialog>

      {/* Subscribe confirm dialog */}
      <AlertDialog open={!!upgradeTarget} onOpenChange={o => !o && setUpgradeTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Subscribe to {upgradeTarget?.plan.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {upgradeTarget?.plan.price === 0
                ? 'This is a free plan — no charge.'
                : upgradeTarget?.cycle === 'yearly' && (upgradeTarget.plan.yearly_price ?? 0) > 0
                  ? `You will be charged RWF ${(upgradeTarget.plan.yearly_price!).toLocaleString()} per year. Your current plan will be cancelled immediately.`
                  : `You will be charged RWF ${Number(upgradeTarget?.plan.price ?? 0).toLocaleString()} per month. Your current plan will be cancelled immediately.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleSubscribe()}
              disabled={subscribe.isPending}
            >
              {subscribe.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm &amp; Subscribe
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// ─── FeatureGate ──────────────────────────────────────────

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const subQuery   = useSaasSubscription()
  const plansQuery = useSaasPlans()

  const summary = subQuery.data
  const plans   = plansQuery.data ?? []

  // While loading, render children optimistically — avoids flash of locked state
  if (subQuery.isPending) return <>{children}</>

  // No subscription → SubscriptionBlocker handles the full block
  // FeatureGate only handles feature-level locks within an active subscription
  if (!summary?.main_subscription) return <>{children}</>

  const planFeatures = summary.main_subscription.plan?.features ?? []
  const hasAccess    = planGrantsFeature(planFeatures, feature)

  if (hasAccess) return <>{children}</>

  const featureLabel = FEATURE_LABELS[feature] ?? feature

  const upgradeModal = (
    <UpgradeModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      featureLabel={featureLabel}
      plans={plans}
      isLoadingPlans={plansQuery.isPending}
      isPlansError={plansQuery.isError}
      onRetryPlans={() => void plansQuery.refetch()}
      currentPlanId={summary.main_subscription.plan_id}
    />
  )

  // Custom fallback provided
  if (fallback) {
    return (
      <>
        <div onClick={() => setModalOpen(true)} className="cursor-pointer">
          {fallback}
        </div>
        {upgradeModal}
      </>
    )
  }

  // Default: blurred content with a lock overlay
  return (
    <>
      <div className="relative">
        <div className="pointer-events-none select-none blur-sm opacity-40">
          {children}
        </div>
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
      {upgradeModal}
    </>
  )
}

// ─── useFeatureAccess hook ────────────────────────────────

export function useFeatureAccess(feature: FeatureKey): {
  allowed: boolean
  loading: boolean
  planName?: string
} {
  const subQuery = useSaasSubscription()
  const summary  = subQuery.data

  if (subQuery.isPending) return { allowed: true, loading: true }
  if (!summary?.main_subscription) return { allowed: false, loading: false }

  const planFeatures = summary.main_subscription.plan?.features ?? []
  const allowed      = planGrantsFeature(planFeatures, feature)

  return {
    allowed,
    loading: false,
    planName: summary.main_subscription.plan?.name,
  }
}
