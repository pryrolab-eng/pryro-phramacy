'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Activity, AlertTriangle, Calendar, CheckCircle, CreditCard,
  Crown, GitBranch, Loader2, Plus, Receipt, RefreshCw,
  TrendingUp, Users, XCircle,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import {
  useSaasSubscription, useSaasPlans, useSaasInvoices,
  useSubscribeToPlan, useCancelSubscription,
} from '@/hooks/useSaasSubscription'
import { BillingStatCard, InvoicesTable, PlansGrid } from '@/components/subscription'
import type { SubscriptionPlan } from '@/lib/saas/types'

// ─── Helpers ──────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:   'bg-green-100 text-green-700 border-green-200',
    trialing: 'bg-blue-100 text-blue-700 border-blue-200',
    past_due: 'bg-amber-100 text-amber-700 border-amber-200',
  }
  const cls = map[status] ?? 'bg-red-100 text-red-700 border-red-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

function LimitBar({ icon, label, used, limit }: {
  icon: React.ReactNode; label: string; used: number | null; limit: number
}) {
  if (limit === 0 && used === null) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-medium text-gray-700">{icon}{label}</span>
          <span className="text-gray-400 text-xs">No plan</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100" />
      </div>
    )
  }
  const pct = used !== null && limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : null
  const color = pct === null ? 'bg-blue-500' : pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium text-gray-700">{icon}{label}</span>
        <span className="font-bold text-gray-900 tabular-nums">
          {used !== null ? `${used} / ${limit}` : limit.toLocaleString()}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: pct !== null ? `${pct}%` : '100%' }} />
      </div>
    </div>
  )
}

function BranchUsageRow({ branch }: {
  branch: { id: string; name: string; usage: { tx_count: number; tx_limit: number; is_blocked: boolean; billing_cycle_end: string } | null }
}) {
  const usage = branch.usage
  if (!usage) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
        <span className="text-sm font-medium text-gray-700">{branch.name}</span>
        <span className="text-xs text-gray-400">No usage record</span>
      </div>
    )
  }
  const pct = usage.tx_limit > 0 ? Math.min(100, Math.round((usage.tx_count / usage.tx_limit) * 100)) : 0
  const color = usage.is_blocked ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div className={`rounded-xl border px-4 py-3 space-y-2 ${usage.is_blocked ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">{branch.name}</span>
        <div className="flex items-center gap-2">
          {usage.is_blocked && (
            <Badge variant="destructive" className="text-[10px]">
              <AlertTriangle className="h-2.5 w-2.5 mr-1" />Blocked
            </Badge>
          )}
          <span className="text-xs text-gray-400">Resets {new Date(usage.billing_cycle_end).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-semibold text-gray-600 whitespace-nowrap tabular-nums">
          {usage.tx_count.toLocaleString()} / {usage.tx_limit.toLocaleString()} tx
        </span>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────

export default function PharmacyBillingPage() {
  const subQuery      = useSaasSubscription()
  const plansQuery    = useSaasPlans()
  const invoicesQuery = useSaasInvoices()
  const subscribe     = useSubscribeToPlan()
  const cancel        = useCancelSubscription()

  const [upgradeTarget, setUpgradeTarget] = useState<{ plan: SubscriptionPlan; cycle: 'monthly' | 'yearly' } | null>(null)
  const [cancelTarget, setCancelTarget]   = useState<string | null>(null)
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null)
  const [generatingInvoice, setGeneratingInvoice] = useState(false)

  const summary  = subQuery.data
  const plans    = plansQuery.data ?? []
  const invoices = invoicesQuery.data ?? []

  const paidInvoices    = invoices.filter(i => i.status === 'paid').length
  const overdueInvoices = invoices.filter(i => i.status === 'overdue').length
  const totalBilled     = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.total ?? 0), 0)

  const handleSelectPlan = (plan: SubscriptionPlan, cycle: 'monthly' | 'yearly') => {
    setUpgradeTarget({ plan, cycle })
  }

  const handleSubscribe = async () => {
    if (!upgradeTarget) return
    const { plan, cycle } = upgradeTarget
    setPendingPlanId(plan.id)
    const tid = toast.loading(`Subscribing to ${plan.name}…`)
    try {
      await subscribe.mutateAsync({ plan_id: plan.id, subscription_type: 'main', billing_cycle: cycle })
      setUpgradeTarget(null)
      toast.success(`Subscribed to ${plan.name}`, { id: tid, description: `Billing cycle: ${cycle}` })
    } catch (err) {
      toast.error('Subscription failed', { id: tid, description: err instanceof Error ? err.message : 'Could not subscribe to plan' })
    } finally {
      setPendingPlanId(null)
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    const tid = toast.loading('Cancelling subscription…')
    try {
      await cancel.mutateAsync(cancelTarget)
      setCancelTarget(null)
      toast.success('Subscription cancelled', { id: tid })
    } catch (err) {
      toast.error('Cancel failed', { id: tid, description: err instanceof Error ? err.message : 'Could not cancel subscription' })
    }
  }

  const handleGenerateInvoice = async () => {
    setGeneratingInvoice(true)
    const tid = toast.loading('Generating invoice…')
    try {
      const res  = await fetch('/api/saas/invoice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      void invoicesQuery.refetch()
      toast.success('Invoice generated', { id: tid })
    } catch (err) {
      toast.error('Failed to generate invoice', { id: tid, description: err instanceof Error ? err.message : 'Please try again' })
    } finally {
      setGeneratingInvoice(false)
    }
  }

  if (subQuery.isPending || plansQuery.isPending) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner className="size-6" /></div>
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-600" />Billing &amp; Subscription
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your plan, branches, and invoices</p>
        </div>
        <Button variant="outline" size="sm"
          onClick={() => { void subQuery.refetch(); void plansQuery.refetch(); void invoicesQuery.refetch() }}
          disabled={subQuery.isFetching || plansQuery.isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${(subQuery.isFetching || plansQuery.isFetching) ? 'animate-spin' : ''}`} />Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BillingStatCard icon={<CreditCard className="h-5 w-5" />} label="Current Plan"
          value={summary?.main_subscription?.plan?.name ?? 'No Plan'} accent="blue" />
        <BillingStatCard icon={<GitBranch className="h-5 w-5" />} label="Branches"
          value={summary?.main_subscription ? `${summary.branch_count} / ${summary.branch_limit}` : `${summary?.branch_count ?? 0} branches`}
          sub={summary?.main_subscription ? (summary.can_add_branch ? 'Can add more' : 'At limit') : 'No active plan'}
          accent="green" />
        <BillingStatCard icon={<TrendingUp className="h-5 w-5" />} label="Monthly Cost"
          value={`RWF ${(summary?.total_monthly_cost ?? 0).toLocaleString()}`}
          sub={`${(summary?.branch_subscriptions ?? []).length + (summary?.main_subscription ? 1 : 0)} active subscription(s)`}
          accent="purple" />
        <BillingStatCard icon={<Calendar className="h-5 w-5" />} label="Renews"
          value={summary?.main_subscription?.current_period_end ? new Date(summary.main_subscription.current_period_end).toLocaleDateString() : '—'}
          sub={summary?.main_subscription?.status ? `Status: ${summary.main_subscription.status}` : undefined}
          accent="orange" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="plan">
        <TabsList className="bg-gray-100 rounded-xl p-1">
          <TabsTrigger value="plan" className="rounded-lg">Current Plan</TabsTrigger>
          <TabsTrigger value="upgrade" className="rounded-lg">Upgrade / Change</TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-lg flex items-center gap-1.5">
            Invoices
            {invoices.length > 0 && (
              <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-700">{invoices.length}</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Current Plan tab */}
        <TabsContent value="plan" className="mt-6 space-y-6">
          {summary?.main_subscription ? (
            <>
              <Card className="rounded-2xl border-gray-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-lg">{summary.main_subscription.plan?.name ?? 'Active Plan'}</CardTitle>
                        <StatusBadge status={summary.main_subscription.status} />
                      </div>
                      <CardDescription>
                        {summary.main_subscription.plan?.billing_period === 'free'
                          ? 'Free forever'
                          : `RWF ${Number(summary.main_subscription.plan?.price ?? 0).toLocaleString()} / ${summary.main_subscription.plan?.billing_period}`}
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 shrink-0"
                      onClick={() => setCancelTarget(summary.main_subscription!.id)}>
                      <XCircle className="h-4 w-4 mr-1.5" />Cancel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <LimitBar icon={<GitBranch className="h-4 w-4 text-blue-500" />} label="Branches"
                      used={summary.branch_count} limit={summary.branch_limit} />
                    <LimitBar icon={<Users className="h-4 w-4 text-purple-500" />} label="Staff Members"
                      used={summary.user_count ?? null} limit={summary.main_subscription.plan?.max_users ?? 0} />
                    <LimitBar icon={<Activity className="h-4 w-4 text-green-500" />} label="Tx / Branch / mo"
                      used={null} limit={summary.main_subscription.plan?.monthly_tx_limit ?? 0} />
                  </div>
                  {summary.main_subscription.plan?.features?.length ? (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Included features</p>
                      <ul className="grid grid-cols-2 gap-y-2 gap-x-4">
                        {summary.main_subscription.plan.features.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-6 text-xs text-gray-400 border-t pt-4">
                    <span>Started: {summary.main_subscription.current_period_start ? new Date(summary.main_subscription.current_period_start).toLocaleDateString() : '—'}</span>
                    <span>Ends: {summary.main_subscription.current_period_end ? new Date(summary.main_subscription.current_period_end).toLocaleDateString() : '—'}</span>
                  </div>
                </CardContent>
              </Card>

              {summary.branch_subscriptions.length > 0 && (
                <Card className="rounded-2xl border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Branch Add-ons</CardTitle>
                    <CardDescription>Extra branch subscriptions on top of your main plan</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {summary.branch_subscriptions.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{sub.plan?.name ?? 'Branch Add-on'}</p>
                          <p className="text-xs text-gray-400">RWF {Number(sub.plan?.price ?? 0).toLocaleString()} / {sub.plan?.billing_period}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={sub.status} />
                          <Button variant="ghost" size="sm" className="text-red-500 h-7 text-xs" onClick={() => setCancelTarget(sub.id)}>Cancel</Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {summary.branches.length > 0 && (
                <Card className="rounded-2xl border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">Branch Usage This Month</CardTitle>
                    <CardDescription>Transaction counts per branch for the current billing cycle</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {summary.branches.map(branch => <BranchUsageRow key={branch.id} branch={branch} />)}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-amber-500" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900">No active subscription</p>
                <p className="text-sm text-gray-500 mt-1">Choose a plan below to unlock all features</p>
              </div>
              <Button onClick={() => { const el = document.querySelector('[data-value="upgrade"]') as HTMLElement | null; el?.click() }}>
                View Plans
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Upgrade tab */}
        <TabsContent value="upgrade" className="mt-6">
          <PlansGrid plans={plans} currentPlanId={summary?.main_subscription?.plan_id}
            isLoading={plansQuery.isFetching && plans.length === 0} isError={plansQuery.isError}
            pendingPlanId={pendingPlanId} onSelect={handleSelectPlan}
            onRetry={() => void plansQuery.refetch()} />
        </TabsContent>

        {/* Invoices tab */}
        <TabsContent value="invoices" className="mt-6 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <BillingStatCard icon={<Receipt className="h-5 w-5" />} label="Total invoices" value={invoices.length} accent="blue" />
            <BillingStatCard icon={<CheckCircle className="h-5 w-5" />} label="Paid" value={paidInvoices} sub={`RWF ${totalBilled.toLocaleString()} total`} accent="green" />
            <BillingStatCard icon={<AlertTriangle className="h-5 w-5" />} label="Overdue" value={overdueInvoices} accent={overdueInvoices > 0 ? 'red' : 'green'} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Combined monthly invoices for all your subscriptions</p>
            <Button variant="outline" size="sm" onClick={() => void handleGenerateInvoice()} disabled={generatingInvoice}>
              {generatingInvoice ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Generate This Month
            </Button>
          </div>
          {invoicesQuery.isPending
            ? <div className="flex justify-center py-8"><Spinner className="size-5" /></div>
            : <InvoicesTable invoices={invoices} pageSize={8} cardView />}
        </TabsContent>
      </Tabs>

      {/* Subscribe confirm */}
      <AlertDialog open={!!upgradeTarget} onOpenChange={o => !o && setUpgradeTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Subscribe to {upgradeTarget?.plan.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {upgradeTarget?.plan.price === 0 ? 'This is a free plan — no charge.'
                : upgradeTarget?.cycle === 'yearly' && (upgradeTarget.plan.yearly_price ?? 0) > 0
                  ? `You will be charged RWF ${(upgradeTarget.plan.yearly_price!).toLocaleString()} per year. Your current plan will be cancelled immediately.`
                  : `You will be charged RWF ${Number(upgradeTarget?.plan.price ?? 0).toLocaleString()} per month. Your current plan will be cancelled immediately.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleSubscribe()} disabled={subscribe.isPending}>
              {subscribe.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel confirm */}
      <AlertDialog open={!!cancelTarget} onOpenChange={o => !o && setCancelTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately cancel the subscription. Branches may lose access if no active plan remains.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => void handleCancel()} disabled={cancel.isPending}>
              {cancel.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
