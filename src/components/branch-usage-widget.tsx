'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity, AlertTriangle, Building2, CreditCard, GitBranch,
  RefreshCw, TrendingUp,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useSaasSubscription } from '@/hooks/useSaasSubscription'
import type { BranchUsage, Branch } from '@/lib/saas/types'

type BranchWithUsage = Branch & { usage: BranchUsage | null }

function usagePct(usage: BranchUsage | null): number {
  if (!usage || usage.tx_limit === 0) return 0
  return Math.min(100, Math.round((usage.tx_count / usage.tx_limit) * 100))
}

function barColor(pct: number, blocked: boolean): string {
  if (blocked) return 'bg-red-500'
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-green-500'
}

export function BranchUsageWidget() {
  const { data: summary, isPending, isFetching, refetch } = useSaasSubscription()

  if (isPending) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="size-5" />
        </CardContent>
      </Card>
    )
  }

  if (!summary?.main_subscription) {
    return (
      <Card className="border-amber-300 bg-amber-50">
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">No active subscription</p>
            <p className="text-xs text-amber-700">Subscribe to a plan to unlock all features.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-400 text-amber-700 hover:bg-amber-100 shrink-0"
            onClick={() => { window.location.href = '/pharmacy-dashboard/billing' }}
          >
            <CreditCard className="h-3.5 w-3.5 mr-1" />
            Subscribe
          </Button>
        </CardContent>
      </Card>
    )
  }

  const branches: BranchWithUsage[] = summary.branches ?? []
  const blockedCount = branches.filter(b => b.usage?.is_blocked).length
  const planName = summary.main_subscription.plan?.name ?? 'Active Plan'
  const totalCost = summary.total_monthly_cost

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            Subscription &amp; Branch Usage
          </CardTitle>
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
              className="h-6 w-6"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Plan summary row */}
        <div className="flex items-center justify-between text-sm bg-muted/40 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{planName}</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground text-xs">
            <span className="flex items-center gap-1">
              <GitBranch className="h-3.5 w-3.5" />
              {summary.branch_count}/{summary.branch_limit} branches
            </span>
            <span>RWF {totalCost.toLocaleString()}/mo</span>
          </div>
        </div>

        {/* Per-branch usage */}
        {branches.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Building2 className="h-4 w-4" />
            No branches yet.{' '}
            <a href="/branches" className="underline">Add a branch →</a>
          </div>
        ) : (
          <div className="space-y-2">
            {branches.map(branch => {
              const usage = branch.usage
              const pct = usagePct(usage)
              const color = barColor(pct, usage?.is_blocked ?? false)
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
                    <span className="text-muted-foreground">
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

        {/* Footer link */}
        <div className="pt-1 border-t">
          <a
            href="/pharmacy-dashboard/billing"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Manage subscription &amp; invoices →
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
