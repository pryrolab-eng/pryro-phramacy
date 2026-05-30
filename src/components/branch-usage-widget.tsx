'use client'

import { DashboardSectionCard } from '@/components/dashboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity, AlertTriangle, Building2, CreditCard, GitBranch,
  RefreshCw, TrendingUp,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useSaasSubscription } from '@/hooks/useSaasSubscription'
import { isAtLimit, limitUsageTextClass } from '@/lib/billing/limit-display'
import type { BranchUsage, Branch } from '@/lib/saas/types'
import { PHARMACY_ROUTES } from '@/lib/routes/pharmacy-paths'
import { cn } from '@/lib/utils'

type BranchWithUsage = Branch & { usage: BranchUsage | null }

function usagePct(usage: BranchUsage | null): number {
  if (!usage || usage.tx_limit === 0) return 0
  return Math.min(100, Math.round((usage.tx_count / usage.tx_limit) * 100))
}

function barColor(pct: number, blocked: boolean, atLimit: boolean): string {
  if (blocked || atLimit) return 'bg-red-500'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-green-500'
}

export function BranchUsageWidget() {
  const { data: summary, isPending, isFetching, refetch } = useSaasSubscription()

  if (isPending) {
    return (
      <DashboardSectionCard title="Subscription & branch usage">
        <div className="flex items-center justify-center py-8">
          <Spinner className="size-5" />
        </div>
      </DashboardSectionCard>
    )
  }

  if (!summary?.main_subscription) {
    return (
      <DashboardSectionCard
        title="No active subscription"
        description="Subscribe to a plan to unlock all features."
        className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
        action={
          <Button
            size="sm"
            variant="outline"
            className="border-amber-400 text-amber-700 hover:bg-amber-100 shrink-0"
            onClick={() => { window.location.href = PHARMACY_ROUTES.billing }}
          >
            <CreditCard className="h-3.5 w-3.5 mr-1" />
            Subscribe
          </Button>
        }
      >
        <div className="flex items-center gap-3 text-sm text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>Billing and branch limits apply once you have an active plan.</p>
        </div>
      </DashboardSectionCard>
    )
  }

  const branches: BranchWithUsage[] = summary.branches ?? []
  const blockedCount = branches.filter(b => b.usage?.is_blocked).length
  const planName = summary.main_subscription.plan?.name ?? 'Active Plan'
  const totalCost = summary.total_monthly_cost

  return (
    <DashboardSectionCard
      title="Subscription & branch usage"
      action={
        <div className="flex items-center gap-2">
          {blockedCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {blockedCount} blocked
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Refresh usage"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm bg-neutral-50 rounded-lg px-3 py-2 dark:bg-neutral-800/50">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
            <span className="font-medium">{planName}</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground text-xs">
            <span
              className={cn(
                "flex items-center gap-1",
                isAtLimit(summary.branch_count, summary.branch_limit) &&
                  limitUsageTextClass(true),
              )}
            >
              <GitBranch className="h-3.5 w-3.5" />
              {summary.branch_count}/{summary.branch_limit} branches
            </span>
            <span>RWF {totalCost.toLocaleString()}/mo</span>
          </div>
        </div>

        {branches.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Building2 className="h-4 w-4" />
            No branches yet.{' '}
            <a href={PHARMACY_ROUTES.branches} className="underline">Add a branch →</a>
          </div>
        ) : (
          <div className="space-y-2">
            {branches.map(branch => {
              const usage = branch.usage
              const pct = usagePct(usage)
              const atLimit = usage
                ? isAtLimit(usage.tx_count, usage.tx_limit)
                : false
              const color = barColor(pct, usage?.is_blocked ?? false, atLimit)
              return (
                <div key={branch.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {branch.name}
                      {usage?.is_blocked && (
                        <Badge variant="destructive" className="text-[10px] px-1 py-0 ml-1">Blocked</Badge>
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-muted-foreground",
                        atLimit && limitUsageTextClass(true),
                      )}
                    >
                      {usage
                        ? `${usage.tx_count.toLocaleString()} / ${usage.tx_limit.toLocaleString()} tx`
                        : 'No record'}
                    </span>
                  </div>
                  {usage && (
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <a
            href={PHARMACY_ROUTES.billing}
            className="text-xs text-neutral-700 hover:underline flex items-center gap-1 dark:text-neutral-300"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Manage subscription &amp; invoices →
          </a>
        </div>
      </div>
    </DashboardSectionCard>
  )
}
