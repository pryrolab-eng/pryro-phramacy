'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  CreditCard, CheckCircle, Crown, GitBranch, Users, Activity,
  Loader2, RefreshCw, Receipt, Plus, XCircle, TrendingUp,
  Calendar, AlertTriangle,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import {
  useSaasSubscription,
  useSaasPlans,
  useSaasInvoices,
  useSubscribeToPlan,
  useCancelSubscription,
  saasKeys,
} from '@/hooks/useSaasSubscription'
import { useQueryClient } from '@tanstack/react-query'
import type { SubscriptionPlan, SubscriptionInvoice } from '@/lib/saas/types'

// ─── Helpers ──────────────────────────────────────────────

function invoiceStatusVariant(status: string) {
  if (status === 'paid') return 'default' as const
  if (status === 'overdue') return 'destructive' as const
  if (status === 'void') return 'secondary' as const
  return 'outline' as const
}

function planBadgeColor(planType: string) {
  return planType === 'main' ? 'default' : 'secondary'
}

// ─── Page ─────────────────────────────────────────────────

export default function PharmacyBillingPage() {
  const subQuery = useSaasSubscription()
  const plansQuery = useSaasPlans()
  const invoicesQuery = useSaasInvoices()
  const subscribe = useSubscribeToPlan()
  const cancel = useCancelSubscription()
  const queryClient = useQueryClient()

  const [upgradeTarget, setUpgradeTarget] = useState<SubscriptionPlan | null>(null)
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const summary = subQuery.data
  const plans = (plansQuery.data ?? []).filter(p => p.plan_type === 'main' && p.is_active)
  const invoices = invoicesQuery.data ?? []

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    try {
      await subscribe.mutateAsync({
        plan_id: plan.id,
        subscription_type: 'main',
        billing_cycle: billingCycle,
      })
      setUpgradeTarget(null)
      showToast(`Subscribed to ${plan.name} (${billingCycle}) successfully`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Subscription failed', 'error')
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    try {
      await cancel.mutateAsync(cancelTarget)
      setCancelTarget(null)
      showToast('Subscription cancelled')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Cancel failed', 'error')
    }
  }

  const handleGenerateInvoice = async () => {
    setGeneratingInvoice(true)
    try {
      const res = await fetch('/api/saas/invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      void invoicesQuery.refetch()
      showToast('Invoice generated')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to generate invoice', 'error')
    } finally {
      setGeneratingInvoice(false)
    }
  }

  if (subQuery.isPending || plansQuery.isPending) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-blue-600" />
            Billing & Subscription
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your plan, branches, and invoices
          </p>
        </div>
        <Button variant="outline" onClick={() => {
          void subQuery.refetch()
          void plansQuery.refetch()
        }} disabled={subQuery.isFetching || plansQuery.isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${(subQuery.isFetching || plansQuery.isFetching) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<CreditCard className="h-5 w-5 text-blue-500" />}
          label="Current Plan"
          value={summary?.main_subscription?.plan?.name ?? 'No Plan'}
        />
        <SummaryCard
          icon={<GitBranch className="h-5 w-5 text-green-500" />}
          label="Branches"
          value={`${summary?.branch_count ?? 0} / ${summary?.branch_limit ?? 0}`}
        />
        <SummaryCard
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          label="Monthly Cost"
          value={`RWF ${(summary?.total_monthly_cost ?? 0).toLocaleString()}`}
        />
        <SummaryCard
          icon={<Calendar className="h-5 w-5 text-orange-500" />}
          label="Renews"
          value={
            summary?.main_subscription?.current_period_end
              ? new Date(summary.main_subscription.current_period_end).toLocaleDateString()
              : '—'
          }
        />
      </div>

      <Tabs defaultValue="plan">
        <TabsList>
          <TabsTrigger value="plan">Current Plan</TabsTrigger>
          <TabsTrigger value="upgrade">Upgrade / Change</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        {/* ── Current Plan tab ── */}
        <TabsContent value="plan" className="mt-6 space-y-6">
          {summary?.main_subscription ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    {summary.main_subscription.plan?.name ?? 'Active Plan'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={summary.main_subscription.status} />
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setCancelTarget(summary.main_subscription!.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {summary.main_subscription.plan?.billing_period === 'free'
                    ? 'Free forever'
                    : `RWF ${Number(summary.main_subscription.plan?.price ?? 0).toLocaleString()} / ${summary.main_subscription.plan?.billing_period}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Limits */}
                <div className="grid grid-cols-3 gap-4">
                  <LimitCard
                    icon={<GitBranch className="h-4 w-4 text-blue-500" />}
                    label="Branches"
                    used={summary.branch_count}
                    limit={summary.branch_limit}
                  />
                  <LimitCard
                    icon={<Users className="h-4 w-4 text-green-500" />}
                    label="Staff Users"
                    used={summary.user_count ?? null}
                    limit={summary.main_subscription.plan?.max_users ?? 0}
                  />
                  <LimitCard
                    icon={<Activity className="h-4 w-4 text-purple-500" />}
                    label="Tx / Branch / mo"
                    used={null}
                    limit={summary.main_subscription.plan?.monthly_tx_limit ?? 0}
                  />
                </div>

                {/* Features */}
                {summary.main_subscription.plan?.features?.length ? (
                  <div>
                    <p className="text-sm font-medium mb-2">Included features</p>
                    <ul className="grid grid-cols-2 gap-1">
                      {summary.main_subscription.plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Period */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground border-t pt-4">
                  <span>
                    Started:{' '}
                    {summary.main_subscription.current_period_start
                      ? new Date(summary.main_subscription.current_period_start).toLocaleDateString()
                      : '—'}
                  </span>
                  <span>
                    Ends:{' '}
                    {summary.main_subscription.current_period_end
                      ? new Date(summary.main_subscription.current_period_end).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertTriangle className="h-10 w-10 text-amber-500" />
                <div className="text-center">
                  <p className="font-semibold text-lg">No active subscription</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Choose a plan below to unlock all features
                  </p>
                </div>
                <Button onClick={() => document.querySelector<HTMLButtonElement>('[data-value="upgrade"]')?.click()}>
                  View Plans
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Branch add-on subscriptions */}
          {summary?.branch_subscriptions && summary.branch_subscriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Branch Add-ons</CardTitle>
                <CardDescription>Extra branch subscriptions on top of your main plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.branch_subscriptions.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{sub.plan?.name ?? 'Branch Add-on'}</p>
                        <p className="text-xs text-muted-foreground">
                          RWF {Number(sub.plan?.price ?? 0).toLocaleString()} / {sub.plan?.billing_period}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={sub.status} />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 h-7"
                          onClick={() => setCancelTarget(sub.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Per-branch usage */}
          {summary?.branches && summary.branches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Branch Usage This Month</CardTitle>
                <CardDescription>Transaction counts per branch for the current billing cycle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.branches.map(branch => (
                    <BranchUsageRow key={branch.id} branch={branch} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Upgrade tab ── */}
        <TabsContent value="upgrade" className="mt-6">
          {/* Billing cycle toggle */}
          {(() => {
            const firstPaid = plans.find(p => p.price > 0 && (p.yearly_price ?? 0) > 0)
            const discPct = firstPaid?.yearly_discount_pct ?? null
            return (
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Monthly
                </span>
                <button
                  onClick={() => setBillingCycle(c => c === 'monthly' ? 'yearly' : 'monthly')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'}`}
                  role="switch"
                  aria-checked={billingCycle === 'yearly'}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Yearly
                  {discPct !== null && discPct > 0 && (
                    <span className="ml-1.5 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Save {discPct}%
                    </span>
                  )}
                </span>
              </div>
            )
          })()}
          {plansQuery.isError && (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-destructive">Could not load plans. Please try again.</p>
              <Button variant="outline" size="sm" onClick={() => void plansQuery.refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />Retry
              </Button>
            </div>
          )}
          {plansQuery.isFetching && plans.length === 0 && (
            <div className="flex justify-center py-8"><Spinner className="size-5" /></div>
          )}
          {!plansQuery.isError && plans.length === 0 && !plansQuery.isFetching && (
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-sm text-muted-foreground">No subscription plans available yet.</p>
              <p className="text-xs text-muted-foreground">Contact your administrator to set up plans.</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                billingCycle={billingCycle}
                isCurrent={summary?.main_subscription?.plan_id === plan.id}
                onSelect={() => setUpgradeTarget(plan)}
              />
            ))}
          </div>
        </TabsContent>

        {/* ── Invoices tab ── */}
        <TabsContent value="invoices" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Combined monthly invoices for all your subscriptions
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleGenerateInvoice()}
              disabled={generatingInvoice}
            >
              {generatingInvoice ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Generate This Month
            </Button>
          </div>

          {invoicesQuery.isPending ? (
            <div className="flex justify-center py-8"><Spinner className="size-5" /></div>
          ) : invoices.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
                <Receipt className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">No invoices yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invoices.map(inv => (
                <InvoiceCard key={inv.id} invoice={inv} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Upgrade confirm dialog */}
      <AlertDialog open={!!upgradeTarget} onOpenChange={o => !o && setUpgradeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Subscribe to {upgradeTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {upgradeTarget?.price === 0
                ? 'This is a free plan.'
                : billingCycle === 'yearly' && (upgradeTarget?.yearly_price ?? 0) > 0
                  ? (() => {
                      const yp = upgradeTarget!.yearly_price!
                      const discPct = upgradeTarget?.yearly_discount_pct ?? 0
                      const savings = Math.round((upgradeTarget?.price ?? 0) * 12) - yp
                      return `You will be charged RWF ${yp.toLocaleString()} per year${savings > 0 ? ` — saving RWF ${savings.toLocaleString()}${discPct > 0 ? ` (${discPct}% off)` : ''}` : ''}.`
                    })()
                  : `You will be charged RWF ${Number(upgradeTarget?.price ?? 0).toLocaleString()} per month.`}
              {' '}Your current plan will be cancelled immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => upgradeTarget && void handleSubscribe(upgradeTarget)}
              disabled={subscribe.isPending}
            >
              {subscribe.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel confirm dialog */}
      <AlertDialog open={!!cancelTarget} onOpenChange={o => !o && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately cancel the subscription. Branches may lose access if no active plan remains.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => void handleCancel()}
              disabled={cancel.isPending}
            >
              {cancel.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-xl font-bold leading-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LimitCard({
  icon, label, used, limit,
}: {
  icon: React.ReactNode
  label: string
  used: number | null
  limit: number
}) {
  const pct = used !== null && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : null
  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold">
        {used !== null ? `${used} / ${limit}` : limit.toLocaleString()}
      </p>
      {pct !== null && (
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

function BranchUsageRow({ branch }: { branch: { id: string; name: string; usage: { tx_count: number; tx_limit: number; is_blocked: boolean; billing_cycle_end: string } | null } }) {
  const usage = branch.usage
  if (!usage) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <span className="font-medium text-sm">{branch.name}</span>
        <Badge variant="secondary">No usage record</Badge>
      </div>
    )
  }
  const pct = usage.tx_limit > 0 ? Math.min(100, Math.round((usage.tx_count / usage.tx_limit) * 100)) : 0
  return (
    <div className={`p-3 border rounded-lg space-y-2 ${usage.is_blocked ? 'border-red-300 bg-red-50' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{branch.name}</span>
        <div className="flex items-center gap-2">
          {usage.is_blocked && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Blocked
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            Resets {new Date(usage.billing_cycle_end).toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-medium whitespace-nowrap">
          {usage.tx_count.toLocaleString()} / {usage.tx_limit.toLocaleString()} tx
        </span>
      </div>
    </div>
  )
}

function PlanCard({
  plan, isCurrent, onSelect, billingCycle = 'monthly',
}: {
  plan: SubscriptionPlan
  isCurrent: boolean
  onSelect: () => void
  billingCycle?: 'monthly' | 'yearly'
}) {
  // Use exactly what the admin stored — no fallback calculations
  const discountPct = plan.yearly_discount_pct ?? 0
  const yearlyPrice = plan.yearly_price != null && plan.yearly_price > 0
    ? plan.yearly_price
    : 0
  const yearlySavings = plan.price > 0 && yearlyPrice > 0
    ? Math.round(plan.price * 12) - yearlyPrice
    : 0
  // Only switch to yearly display if there's an actual yearly price stored
  const showYearly = billingCycle === 'yearly' && plan.price > 0 && yearlyPrice > 0
  const displayPrice = showYearly ? yearlyPrice : plan.price
  const displayPeriod = showYearly ? 'year' : plan.billing_period

  return (
    <Card className={`relative ${plan.is_popular ? 'border-2 border-blue-600' : ''} ${isCurrent ? 'ring-2 ring-green-500' : ''}`}>
      {plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-3">
            <Crown className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-green-600 text-white px-3">Current</Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <div className="text-3xl font-bold">
          {displayPrice === 0 ? 'Free' : `RWF ${Number(displayPrice).toLocaleString()}`}
          {displayPrice > 0 && (
            <span className="text-sm font-normal text-muted-foreground">/{displayPeriod}</span>
          )}
        </div>
        {showYearly && yearlySavings > 0 && (
          <p className="text-xs text-green-600 font-medium">
            Save RWF {yearlySavings.toLocaleString()} vs monthly
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-muted rounded p-2">
            <GitBranch className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <div className="font-bold">{plan.max_branches}</div>
            <div className="text-muted-foreground">Branches</div>
          </div>
          <div className="bg-muted rounded p-2">
            <Users className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <div className="font-bold">{plan.max_users}</div>
            <div className="text-muted-foreground">Users</div>
          </div>
          <div className="bg-muted rounded p-2">
            <Activity className="h-4 w-4 mx-auto mb-1 text-purple-500" />
            <div className="font-bold">{plan.monthly_tx_limit.toLocaleString()}</div>
            <div className="text-muted-foreground">Tx/mo</div>
          </div>
        </div>
        <ul className="space-y-1">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <Button
          className="w-full"
          variant={isCurrent ? 'outline' : 'default'}
          disabled={isCurrent}
          onClick={onSelect}
        >
          {isCurrent ? 'Current Plan' : 'Select Plan'}
        </Button>
      </CardContent>
    </Card>
  )
}

function InvoiceCard({ invoice }: { invoice: SubscriptionInvoice }) {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">{invoice.invoice_number}</span>
              <Badge variant={invoiceStatusVariant(invoice.status)}>{invoice.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {invoice.billing_month} · Due {new Date(invoice.due_date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg">RWF {Number(invoice.total).toLocaleString()}</span>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">View</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invoice {invoice.invoice_number}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Billing month</span>
                    <span>{invoice.billing_month}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Due date</span>
                    <span>{new Date(invoice.due_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={invoiceStatusVariant(invoice.status)}>{invoice.status}</Badge>
                  </div>
                  {invoice.lines && invoice.lines.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-2 font-medium">Description</th>
                            <th className="text-right p-2 font-medium">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.lines.map(line => (
                            <tr key={line.id} className="border-t">
                              <td className="p-2">{line.description}</td>
                              <td className="p-2 text-right">RWF {Number(line.amount).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t bg-muted/30">
                          <tr>
                            <td className="p-2 font-bold">Total</td>
                            <td className="p-2 text-right font-bold">RWF {Number(invoice.total).toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-gray-100 text-gray-600',
    expired: 'bg-red-100 text-red-700',
    past_due: 'bg-orange-100 text-orange-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}
