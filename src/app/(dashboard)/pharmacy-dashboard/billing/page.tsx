'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
  useCancelSubscription,
  useGenerateSaasInvoiceMutation,
} from '@/hooks/useSaasSubscription'
import { BranchAddonCheckoutDialog } from '@/components/subscription/branch-addon-checkout-dialog'
import { SubscriptionPlanManagement } from '@/components/subscription/subscription-plan-management'
import { PlanFeatureList } from '@/components/subscription/plan-feature-list'
import type { SubscriptionPlan, SubscriptionInvoice } from '@/lib/saas/types'
import { UpgradeFeatureBanner } from '@/components/subscription/upgrade-feature-banner'
import { usePharmacyEntitlements } from '@/hooks/usePharmacyEntitlements'

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
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner className="size-6" />
        </div>
      }
    >
      <PharmacyBillingPageContent />
    </Suspense>
  )
}

function PharmacyBillingPageContent() {
  const searchParams = useSearchParams()
  const { can } = usePharmacyEntitlements()
  const [activeTab, setActiveTab] = useState('plan')
  const subQuery = useSaasSubscription()
  const plansQuery = useSaasPlans()
  const invoicesQuery = useSaasInvoices()
  const cancel = useCancelSubscription()
  const generateInvoice = useGenerateSaasInvoiceMutation()

  const [addonPlanTarget, setAddonPlanTarget] = useState<SubscriptionPlan | null>(null)
  const [addonCheckoutOpen, setAddonCheckoutOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const summary = subQuery.data
  const addonPlans = (plansQuery.data ?? []).filter(
    (p) => p.plan_type === 'branch_addon' && p.is_active
  )
  const invoices = invoicesQuery.data ?? []
  const mainSlots = summary?.main_plan_branch_slots ?? summary?.branch_limit ?? 0
  const addonCount = summary?.addon_subscription_count ?? 0

  const openAddonCheckout = (plan: SubscriptionPlan) => {
    setAddonPlanTarget(plan)
    setAddonCheckoutOpen(true)
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
    try {
      await generateInvoice.mutateAsync(undefined)
      showToast('Invoice generated')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to generate invoice', 'error')
    }
  }

  const generatingInvoice = generateInvoice.isPending

  const renewDate = summary?.main_subscription?.current_period_end
    ? new Date(summary.main_subscription.current_period_end)
    : null
  const daysUntilRenew = renewDate
    ? Math.ceil((renewDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const showRenewBanner =
    daysUntilRenew != null && daysUntilRenew <= 7 && daysUntilRenew >= 0

  useEffect(() => {
    const upgrade = searchParams.get('upgrade')
    if (upgrade && !can(upgrade)) {
      setActiveTab('upgrade')
    }
  }, [searchParams, can])

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
        <Button variant="outline" onClick={() => void subQuery.refetch()} disabled={subQuery.isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${subQuery.isFetching ? 'animate-spin' : ''}`} />
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
          label="Branch slots"
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

      <UpgradeFeatureBanner onViewPlans={() => setActiveTab('upgrade')} />

      {showRenewBanner && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2 text-sm text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Your plan renews on {renewDate?.toLocaleDateString()} ({daysUntilRenew}{' '}
                day{daysUntilRenew !== 1 ? 's' : ''} left). Manual renewal is required — choose
                your plan below to pay for the next period.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                document.querySelector<HTMLButtonElement>('[data-value="upgrade"]')?.click()
              }
            >
              Renew / change plan
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plan">Current Plan</TabsTrigger>
          <TabsTrigger value="upgrade">Main plans</TabsTrigger>
          <TabsTrigger value="branch-addons">Branch add-ons</TabsTrigger>
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
                    label="Max Users"
                    used={null}
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

          <Card className="border-dashed bg-muted/20">
            <CardContent className="pt-4 pb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <span className="font-medium">{mainSlots}</span> branches included on your main plan
                {addonCount > 0 && (
                  <>
                    {' '}
                    + <span className="font-medium">{addonCount}</span> paid add-on
                    {addonCount !== 1 ? 's' : ''}
                  </>
                )}
                . Manage locations on{' '}
                <a href="/branches" className="text-blue-600 underline font-medium">
                  Branches
                </a>
                .
              </div>
              {addonPlans.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => document.querySelector<HTMLButtonElement>('[data-value="branch-addons"]')?.click()}>
                  Buy branch add-on
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Branch add-on subscriptions */}
          {summary?.branch_subscriptions && summary.branch_subscriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Active branch add-ons</CardTitle>
                <CardDescription>
                  Each add-on unlocks an extra branch slot and its own transaction limit
                </CardDescription>
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

        {/* ── Main plans tab ── */}
        <TabsContent value="upgrade" className="mt-6 space-y-4">
          <SubscriptionPlanManagement
            checkoutReturnContext="billing"
            showBranchAddons={false}
            onPlanChanged={() => void subQuery.refetch()}
          />
        </TabsContent>

        {/* ── Branch add-ons tab ── */}
        <TabsContent value="branch-addons" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                How branch add-ons work
              </CardTitle>
              <CardDescription>
                Your main plan includes {mainSlots} branch{mainSlots !== 1 ? 'es' : ''}.
                When you need more locations, purchase an add-on: it creates a new branch and
                bills separately with its own monthly transaction limit.
              </CardDescription>
            </CardHeader>
          </Card>

          {addonPlans.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No branch add-on plans are available yet. Your administrator can create plans
                with type &quot;branch_addon&quot; in the admin catalog.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addonPlans.map(plan => (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>
                      RWF {Number(plan.price).toLocaleString()} / {plan.billing_period}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {plan.monthly_tx_limit.toLocaleString()} transactions per month for one
                      branch
                    </p>
                    <Button className="w-full" onClick={() => openAddonCheckout(plan)}>
                      Add branch with this plan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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

      <BranchAddonCheckoutDialog
        open={addonCheckoutOpen}
        onOpenChange={setAddonCheckoutOpen}
        addonPlans={addonPlans}
        mode="new_branch"
        initialPlanId={addonPlanTarget?.id}
        onSuccess={() => {
          void subQuery.refetch()
          showToast('Branch add-on purchased successfully')
        }}
      />

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
  plan, isCurrent, onSelect,
}: {
  plan: SubscriptionPlan
  isCurrent: boolean
  onSelect: () => void
}) {
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
          {plan.price === 0 ? 'Free' : `RWF ${Number(plan.price).toLocaleString()}`}
          {plan.price > 0 && (
            <span className="text-sm font-normal text-muted-foreground">/{plan.billing_period}</span>
          )}
        </div>
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
        <PlanFeatureList features={plan.features} maxVisible={5} dense className="min-h-0" />
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
