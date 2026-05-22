'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle, ArrowRight, Building2, CreditCard,
  Crown, RefreshCw, Users, Zap,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useSaasSubscription } from '@/hooks/useSaasSubscription'

// ─── Helpers ──────────────────────────────────────────────

function pct(used: number, limit: number): number {
  if (limit <= 0) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

function barColor(p: number): string {
  if (p >= 100) return 'bg-red-500'
  if (p >= 80)  return 'bg-amber-500'
  if (p >= 60)  return 'bg-yellow-400'
  return 'bg-green-500'
}

function textColor(p: number): string {
  if (p >= 100) return 'text-red-600'
  if (p >= 80)  return 'text-amber-600'
  return 'text-green-600'
}

// ─── Single quota row ──────────────────────────────────────

interface QuotaRowProps {
  icon: React.ReactNode
  label: string
  used: number
  limit: number
  /** extra badge text shown when at/over limit */
  limitLabel?: string
}

function QuotaRow({ icon, label, used, limit, limitLabel }: QuotaRowProps) {
  // No active plan — show neutral placeholder
  if (limit === 0) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-medium text-foreground">{icon}{label}</span>
          <span className="text-xs text-muted-foreground">No plan</span>
        </div>
        <div className="relative h-2 w-full rounded-full bg-muted" />
        <p className="text-[11px] text-muted-foreground">Subscribe to a plan to see your limits</p>
      </div>
    )
  }

  const p = pct(used, limit)
  const atLimit = used >= limit && limit > 0
  const remaining = Math.max(0, limit - used)

  return (
    <div className="space-y-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          {icon}
          {label}
        </span>
        <div className="flex items-center gap-2">
          {atLimit && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
              Limit reached
            </Badge>
          )}
          <span className={`font-bold tabular-nums ${textColor(p)}`}>
            {used}
            <span className="text-muted-foreground font-normal">/{limit}</span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor(p)}`}
          style={{ width: `${p}%` }}
        />
      </div>

      {/* Sub-label */}
      <p className="text-[11px] text-muted-foreground">
        {atLimit
          ? (limitLabel ?? `All ${limit} slot${limit !== 1 ? 's' : ''} used — upgrade to add more`)
          : `${remaining} slot${remaining !== 1 ? 's' : ''} remaining`}
      </p>
    </div>
  )
}

// ─── Main widget ───────────────────────────────────────────

interface PlanQuotaWidgetProps {
  /** compact = single-row summary card; full = expanded card with all quotas */
  variant?: 'compact' | 'full'
  className?: string
}

export function PlanQuotaWidget({ variant = 'full', className }: PlanQuotaWidgetProps) {
  const { data: summary, isPending, isFetching, refetch } = useSaasSubscription()

  // ── Loading ──────────────────────────────────────────────
  if (isPending) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="size-5" />
        </CardContent>
      </Card>
    )
  }

  // ── No subscription ──────────────────────────────────────
  if (!summary?.main_subscription) {
    return (
      <Card className={`border-amber-300 bg-amber-50 ${className ?? ''}`}>
        <CardContent className="pt-4 pb-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="flex-1 min-w-0">
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

  const plan = summary.main_subscription.plan
  const planName = plan?.name ?? 'Active Plan'
  const planStatus = summary.main_subscription.status

  const branchUsed  = summary.branch_count ?? 0
  const branchLimit = summary.branch_limit ?? 0
  const staffUsed   = summary.user_count ?? 0
  const staffLimit  = plan?.max_users ?? 0

  // Only show quota bars when there's an active plan with real limits
  const hasPlan = !!summary.main_subscription
  const branchPct = hasPlan && branchLimit > 0 ? pct(branchUsed, branchLimit) : 0
  const staffPct  = hasPlan && staffLimit > 0  ? pct(staffUsed, staffLimit)   : 0

  const anyAtLimit = hasPlan && (
    (branchUsed >= branchLimit && branchLimit > 0) ||
    (staffUsed >= staffLimit && staffLimit > 0)
  )

  // ── Compact variant ──────────────────────────────────────
  if (variant === 'compact') {
    return (
      <Card className={`${anyAtLimit ? 'border-amber-300' : ''} ${className ?? ''}`}>
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            {/* Plan badge */}
            <div className="flex items-center gap-2 min-w-0">
              <Crown className="h-4 w-4 text-blue-500 shrink-0" />
              <span className="text-sm font-semibold truncate">{planName}</span>
              <Badge
                variant={planStatus === 'active' ? 'default' : 'secondary'}
                className="text-[10px] capitalize shrink-0"
              >
                {planStatus}
              </Badge>
            </div>

            {/* Inline quota pills */}
            <div className="flex items-center gap-4 text-xs">
              {/* Branches */}
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Branches</span>
                {branchLimit > 0 ? (
                  <>
                    <span className={`font-bold tabular-nums ${textColor(branchPct)}`}>
                      {branchUsed}/{branchLimit}
                    </span>
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor(branchPct)}`}
                        style={{ width: `${branchPct}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <span className="text-muted-foreground">{branchUsed} (no plan)</span>
                )}
              </div>

              {/* Staff */}
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Staff</span>
                {staffLimit > 0 ? (
                  <>
                    <span className={`font-bold tabular-nums ${textColor(staffPct)}`}>
                      {staffUsed}/{staffLimit}
                    </span>
                    <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor(staffPct)}`}
                        style={{ width: `${staffPct}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <span className="text-muted-foreground">{staffUsed} (no plan)</span>
                )}
              </div>
            </div>

            {/* Upgrade CTA if at limit */}
            {anyAtLimit ? (
              <Button
                size="sm"
                variant="outline"
                className="border-amber-400 text-amber-700 hover:bg-amber-100 shrink-0 text-xs h-7"
                onClick={() => { window.location.href = '/pharmacy-dashboard/billing?tab=upgrade' }}
              >
                <Crown className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            ) : (
              <a
                href="/pharmacy-dashboard/billing"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 shrink-0"
              >
                Manage <ArrowRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // ── Full variant ─────────────────────────────────────────
  return (
    <Card className={`${anyAtLimit ? 'border-amber-300' : ''} ${className ?? ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            Plan Usage
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* Plan name + status */}
            <div className="flex items-center gap-1.5">
              <Crown className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-foreground">{planName}</span>
              <Badge
                variant={planStatus === 'active' ? 'default' : 'secondary'}
                className="text-[10px] capitalize"
              >
                {planStatus}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => void refetch()}
              disabled={isFetching}
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Branches quota */}
        <QuotaRow
          icon={<Building2 className="h-3.5 w-3.5 text-blue-500" />}
          label="Branches"
          used={branchUsed}
          limit={branchLimit}
          limitLabel="Branch limit reached — upgrade or add a Branch Add-on"
        />

        {/* Staff quota */}
        <QuotaRow
          icon={<Users className="h-3.5 w-3.5 text-purple-500" />}
          label="Staff Members"
          used={staffUsed}
          limit={staffLimit}
          limitLabel="Staff limit reached — upgrade your plan to add more"
        />

        {/* Upgrade CTA */}
        {anyAtLimit && (
          <div className="pt-1 border-t">
            <Button
              size="sm"
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => { window.location.href = '/pharmacy-dashboard/billing?tab=upgrade' }}
            >
              <Crown className="h-3.5 w-3.5 mr-2" />
              Upgrade Plan to Unlock More Slots
              <ArrowRight className="h-3.5 w-3.5 ml-2" />
            </Button>
          </div>
        )}

        {/* Footer */}
        {!anyAtLimit && (
          <div className="pt-1 border-t">
            <a
              href="/pharmacy-dashboard/billing"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Manage subscription &amp; billing →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
