'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsTrigger } from '@/components/ui/tabs'
import {
  CreditCard,
  CheckCircle,
  GitBranch,
  Users,
  Activity,
  RefreshCw,
  Receipt,
  Plus,
  XCircle,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardPageLoading,
  DashboardToolbar,
  DashboardButton,
  DashboardMetricGrid,
  DashboardStatCard,
  DashboardSectionCard,
  DashboardTableCard,
  DashboardPanelEmpty,
  DashboardTabsList,
  DashboardProgressTrack,
} from '@/components/dashboard'
import {
  useSaasSubscription,
  useSaasPlans,
  useSaasInvoices,
  useCancelSubscription,
  useGenerateSaasInvoiceMutation,
} from '@/hooks/useSaasSubscription'
import { BranchAddonCheckoutDialog } from '@/components/subscription/branch-addon-checkout-dialog'
import { SubscriptionPlanManagement } from '@/components/subscription/subscription-plan-management'
import { UpgradeFeatureBanner } from '@/components/subscription/upgrade-feature-banner'
import { UpgradePrompt } from '@/components/subscription/upgrade-prompt'
import { usePharmacyEntitlements } from '@/hooks/usePharmacyEntitlements'
import { BillingBranchUsageRow } from '@/components/billing/billing-branch-usage-row'
import { BillingInvoiceRow } from '@/components/billing/billing-invoice-row'
import { BillingStatusBadge } from '@/components/billing/billing-status-badge'
import { BillingCancelDialog } from '@/components/billing/billing-cancel-dialog'
import type { SubscriptionPlan } from '@/lib/saas/types'
import { toast } from 'sonner'
import { PHARMACY_ROUTES } from '@/lib/routes/pharmacy-paths'
import { cn } from '@/lib/utils'
import {
  isAtLimit,
  limitUsageBarClass,
  limitUsageTextClass,
} from '@/lib/billing/limit-display'

export default function PharmacyBillingPage() {
  return (
    <Suspense fallback={<DashboardPageLoading label="Loading billing…" />}>
      <PharmacyBillingPageContent />
    </Suspense>
  )
}

function PharmacyBillingPageContent() {
  const searchParams = useSearchParams()
  const { can, isHydrating, isEntitlementsReady, entitlements } =
    usePharmacyEntitlements()
  const [activeTab, setActiveTab] = useState('plan')
  const subQuery = useSaasSubscription()
  const plansQuery = useSaasPlans()
  const invoicesQuery = useSaasInvoices()
  const cancel = useCancelSubscription()
  const generateInvoice = useGenerateSaasInvoiceMutation()

  const [addonPlanTarget, setAddonPlanTarget] = useState<SubscriptionPlan | null>(null)
  const [addonCheckoutOpen, setAddonCheckoutOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)

  const summary = subQuery.data
  const addonPlans = (plansQuery.data ?? []).filter(
    (p) => p.plan_type === 'branch_addon' && p.is_active,
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
      toast.success('Subscription cancelled')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cancel failed')
    }
  }

  const handleGenerateInvoice = async () => {
    try {
      await generateInvoice.mutateAsync(undefined)
      toast.success('Invoice generated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate invoice')
    }
  }

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
    return <DashboardPageLoading label="Loading billing…" />
  }

  const billingAccessible =
    isHydrating ||
    !isEntitlementsReady ||
    can('billing.self_serve') ||
    entitlements.isExpired ||
    !entitlements.isAccessAllowed

  if (!billingAccessible) {
    return (
      <DashboardPageShell className="mx-auto">
        <DashboardPageHeader
          title="Billing"
          description="Manage your pharmacy subscription"
        />
        <UpgradePrompt featureKey="billing.self_serve" />
      </DashboardPageShell>
    )
  }

  const branchSlotPct =
    summary && summary.branch_limit > 0
      ? Math.min(100, (summary.branch_count / summary.branch_limit) * 100)
      : 0

  const primaryBranch =
    summary?.branches.find((b) => b.is_headquarters) ?? summary?.branches[0]
  const txUsage = primaryBranch?.usage
  const planTxLimit = summary?.main_subscription?.plan?.monthly_tx_limit ?? 0
  const txUsed = txUsage?.tx_count ?? 0
  const txLimit = txUsage?.tx_limit ?? planTxLimit
  const txPct =
    txLimit > 0 ? Math.min(100, Math.round((txUsed / txLimit) * 100)) : 0
  const txAtLimit = txUsage?.is_blocked ?? (txLimit > 0 && txUsed >= txLimit)

  return (
      <DashboardPageShell>
        <DashboardPageHeader
          title="Billing"
          description="Plans, branch add-ons, usage, and invoices"
          actions={
            <DashboardToolbar>
              <DashboardButton
                onClick={() => void subQuery.refetch()}
                disabled={subQuery.isFetching}
              >
                <RefreshCw
                  className={`mr-1.5 h-4 w-4 ${subQuery.isFetching ? 'animate-spin' : ''}`}
                />
                Refresh
              </DashboardButton>
            </DashboardToolbar>
          }
        />

        <DashboardMetricGrid>
          <DashboardStatCard
            label="Current plan"
            icon={CreditCard}
            value={summary?.main_subscription?.plan?.name ?? 'No plan'}
            hint="Main subscription"
          />
          <DashboardStatCard
            label="Branch slots"
            icon={GitBranch}
            value={`${summary?.branch_count ?? 0} / ${summary?.branch_limit ?? 0}`}
            hint={`${mainSlots} on main plan${addonCount > 0 ? ` + ${addonCount} add-on` : ''}`}
            valueClassName={limitUsageTextClass(
              isAtLimit(summary?.branch_count ?? 0, summary?.branch_limit ?? 0),
            )}
          />
          <DashboardStatCard
            label="Monthly cost"
            icon={TrendingUp}
            value={`RWF ${(summary?.total_monthly_cost ?? 0).toLocaleString()}`}
            hint="Main plan + add-ons"
          />
          <DashboardStatCard
            label="Renews"
            icon={Calendar}
            value={
              summary?.main_subscription?.current_period_end
                ? new Date(summary.main_subscription.current_period_end).toLocaleDateString()
                : '—'
            }
            hint="Current period end"
          />
        </DashboardMetricGrid>

        <UpgradeFeatureBanner onViewPlans={() => setActiveTab('upgrade')} />

        {showRenewBanner && (
          <DashboardSectionCard
            title="Renewal coming up"
            className="border-amber-200/80 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20"
            action={
              <DashboardButton size="sm" onClick={() => setActiveTab('upgrade')}>
                Renew / change plan
              </DashboardButton>
            }
          >
            <p className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              Your plan renews on {renewDate?.toLocaleDateString()} ({daysUntilRenew}{' '}
              day{daysUntilRenew !== 1 ? 's' : ''} left). Choose a plan to pay for the next
              period.
            </p>
          </DashboardSectionCard>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <DashboardTabsList>
            <TabsTrigger value="plan">Current plan</TabsTrigger>
            <TabsTrigger value="upgrade">Main plans</TabsTrigger>
            <TabsTrigger value="branch-addons">Branch add-ons</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
          </DashboardTabsList>

          <TabsContent value="plan" className="mt-6 space-y-6">
            {summary?.main_subscription?.status === 'pending_payment' && (
              <DashboardSectionCard
                title="Complete payment"
                className="border-amber-200/80 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20"
                action={
                  <DashboardButton size="sm" onClick={() => setActiveTab('upgrade')}>
                    <CreditCard className="mr-1 h-4 w-4" />
                    Pay now
                  </DashboardButton>
                }
              >
                <p className="flex items-start gap-2 text-sm text-amber-900 dark:text-amber-200">
                  <Clock className="mt-0.5 size-4 shrink-0" />
                  Your {summary.main_subscription.plan?.name ?? 'selected'} plan is waiting for payment.
                  Complete payment to activate your subscription and unlock all features.
                </p>
              </DashboardSectionCard>
            )}

            {summary?.main_subscription ? (
              <DashboardSectionCard
                title={summary.main_subscription.plan?.name ?? 'Active plan'}
                description={
                  summary.main_subscription.plan?.billing_period === 'free'
                    ? 'Free forever'
                    : `RWF ${Number(summary.main_subscription.plan?.price ?? 0).toLocaleString()} / ${summary.main_subscription.plan?.billing_period}`
                }
                action={
                  <div className="flex items-center gap-2">
                    <BillingStatusBadge status={summary.main_subscription.status} />
                    <DashboardButton
                      size="sm"
                      tone="destructive"
                      onClick={() => setCancelTarget(summary.main_subscription!.id)}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Cancel
                    </DashboardButton>
                  </div>
                }
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <PlanLimitBlock
                    icon={<GitBranch className="size-4 text-blue-500" />}
                    label="Branches"
                    value={`${summary.branch_count} / ${summary.branch_limit}`}
                    progress={branchSlotPct}
                    atLimit={isAtLimit(summary.branch_count, summary.branch_limit)}
                  />
                  <PlanLimitBlock
                    icon={<Users className="size-4 text-emerald-500" />}
                    label="Max users"
                    value={String(summary.main_subscription.plan?.max_users ?? 0)}
                  />
                  <PlanLimitBlock
                    icon={<Activity className="size-4 text-violet-500" />}
                    label="Tx / branch / mo"
                    value={
                      txUsage
                        ? `${txUsed.toLocaleString()} / ${txLimit.toLocaleString()}`
                        : planTxLimit.toLocaleString()
                    }
                    progress={txUsage ? txPct : undefined}
                    atLimit={txAtLimit}
                    hint={
                      txUsage
                        ? `${primaryBranch?.name ?? 'Branch'} this cycle`
                        : 'Per branch — see usage below'
                    }
                  />
                </div>

                {summary.main_subscription.plan?.features?.length ? (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium">Included features</p>
                    <ul className="grid gap-1 sm:grid-cols-2">
                      {summary.main_subscription.plan.features.map((f, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400"
                        >
                          <CheckCircle className="size-3.5 shrink-0 text-emerald-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-6 border-t border-neutral-100 pt-4 text-sm text-neutral-500 dark:border-neutral-800">
                  <span>
                    Started:{' '}
                    {summary.main_subscription.current_period_start
                      ? new Date(
                          summary.main_subscription.current_period_start,
                        ).toLocaleDateString()
                      : '—'}
                  </span>
                  <span>
                    Ends:{' '}
                    {summary.main_subscription.current_period_end
                      ? new Date(
                          summary.main_subscription.current_period_end,
                        ).toLocaleDateString()
                      : '—'}
                  </span>
                </div>
              </DashboardSectionCard>
            ) : (
              <DashboardSectionCard title="No active subscription">
                <DashboardPanelEmpty
                  icon={AlertTriangle}
                  title="Subscribe to unlock features"
                  description="Choose a main plan to enable branches, POS, and staff."
                />
                <div className="mt-4 flex justify-center">
                  <DashboardButton tone="primary" onClick={() => setActiveTab('upgrade')}>
                    View plans
                  </DashboardButton>
                </div>
              </DashboardSectionCard>
            )}

            <DashboardSectionCard
              title="Branch locations"
              description={`${mainSlots} on main plan${addonCount > 0 ? ` + ${addonCount} add-on${addonCount !== 1 ? 's' : ''}` : ''}`}
              action={
                addonPlans.length > 0 ? (
                  <DashboardButton size="sm" onClick={() => setActiveTab('branch-addons')}>
                    Buy add-on
                  </DashboardButton>
                ) : null
              }
            >
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Manage locations on{' '}
                <Link
                  href={PHARMACY_ROUTES.branches}
                  className="font-medium text-neutral-900 underline dark:text-neutral-100"
                >
                  Branches
                </Link>
                .
              </p>
            </DashboardSectionCard>

            {summary?.branch_subscriptions && summary.branch_subscriptions.length > 0 && (
              <DashboardTableCard
                title="Active branch add-ons"
                description="Each add-on unlocks an extra branch slot"
              >
                <ul className="space-y-2 p-4">
                  {summary.branch_subscriptions.map((sub) => (
                    <li key={sub.id}>
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200/80 px-4 py-3 dark:border-neutral-800">
                        <div>
                          <p className="text-sm font-medium">
                            {sub.plan?.name ?? 'Branch add-on'}
                          </p>
                          <p className="text-xs text-neutral-500">
                            RWF {Number(sub.plan?.price ?? 0).toLocaleString()} /{' '}
                            {sub.plan?.billing_period}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <BillingStatusBadge status={sub.status} />
                          <DashboardButton
                            size="sm"
                            tone="ghost"
                            className="text-red-600"
                            onClick={() => setCancelTarget(sub.id)}
                          >
                            Cancel
                          </DashboardButton>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </DashboardTableCard>
            )}

            {summary?.branches && summary.branches.length > 0 && (
              <DashboardTableCard
                title="Branch usage this month"
                description="Transaction counts per branch for the current billing cycle"
              >
                <ul className="space-y-2 p-4">
                  {summary.branches.map((branch) => (
                    <li key={branch.id}>
                      <BillingBranchUsageRow branch={branch} />
                    </li>
                  ))}
                </ul>
              </DashboardTableCard>
            )}
          </TabsContent>

          <TabsContent value="upgrade" className="mt-6">
            <SubscriptionPlanManagement
              checkoutReturnContext="billing"
              showBranchAddons={false}
              onPlanChanged={() => void subQuery.refetch()}
            />
          </TabsContent>

          <TabsContent value="branch-addons" className="mt-6 space-y-6">
            <DashboardSectionCard
              title="How branch add-ons work"
              description={`Your main plan includes ${mainSlots} branch${mainSlots !== 1 ? 'es' : ''}. Add-ons bill separately with their own monthly transaction limit.`}
            >
              <p className="text-sm text-muted-foreground">
                Each add-on unlocks one extra branch slot and is billed as its own
                subscription line item.
              </p>
            </DashboardSectionCard>

            {addonPlans.length === 0 ? (
              <DashboardPanelEmpty
                icon={GitBranch}
                title="No add-on plans available"
                description='Ask your administrator to publish plans with type "branch_addon".'
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {addonPlans.map((plan) => (
                  <DashboardSectionCard
                    key={plan.id}
                    title={plan.name}
                    description={`RWF ${Number(plan.price).toLocaleString()} / ${plan.billing_period}`}
                    action={
                      <DashboardButton
                        tone="primary"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => openAddonCheckout(plan)}
                      >
                        Add branch
                      </DashboardButton>
                    }
                  >
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {plan.monthly_tx_limit.toLocaleString()} transactions per month for
                      one branch
                    </p>
                  </DashboardSectionCard>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="mt-6 space-y-4">
            <DashboardTableCard
              title="Invoices"
              description="Combined monthly invoices for all subscriptions"
              toolbar={
                <DashboardButton
                  size="sm"
                  onClick={() => void handleGenerateInvoice()}
                  disabled={generateInvoice.isPending}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  {generateInvoice.isPending ? 'Generating…' : 'Generate this month'}
                </DashboardButton>
              }
            >
              {invoicesQuery.isPending ? (
                <p className="p-6 text-center text-sm text-neutral-500">Loading…</p>
              ) : invoices.length === 0 ? (
                <div className="p-6">
                  <DashboardPanelEmpty
                    icon={Receipt}
                    title="No invoices yet"
                    description="Generate an invoice for the current billing month."
                  />
                </div>
              ) : (
                <ul className="space-y-2 p-4">
                  {invoices.map((inv) => (
                    <li key={inv.id}>
                      <BillingInvoiceRow invoice={inv} />
                    </li>
                  ))}
                </ul>
              )}
            </DashboardTableCard>
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
            toast.success('Branch add-on purchased')
          }}
        />

        <BillingCancelDialog
          open={!!cancelTarget}
          onOpenChange={(o) => !o && setCancelTarget(null)}
          onConfirm={() => void handleCancel()}
          isPending={cancel.isPending}
        />
      </DashboardPageShell>
  )
}

function PlanLimitBlock({
  icon,
  label,
  value,
  progress,
  atLimit,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  progress?: number
  atLimit?: boolean
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-3 dark:border-neutral-700 dark:bg-neutral-800/30">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </div>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          atLimit && limitUsageTextClass(true),
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
      {progress !== undefined ? (
        <DashboardProgressTrack
          value={progress}
          className="mt-2"
          barClassName={limitUsageBarClass(!!atLimit)}
        />
      ) : null}
    </div>
  )
}
