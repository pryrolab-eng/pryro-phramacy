'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DashboardButton,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogDescription,
  DashboardDialogBody,
  DashboardDialogActions,
  DashboardMetricGrid,
  DashboardStatCard,
  DashboardDataTable,
  DashboardTabsList,
  DashboardAlertDialogContent,
  DashboardAlertDialogHeader,
  DashboardAlertDialogTitle,
  DashboardAlertDialogDescription,
  DashboardAlertDialogActions,
} from "@/components/dashboard";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { AdminFeedbackDialog, type AdminFeedbackVariant } from "@/components/admin/admin-feedback-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Layers, Plus, TrendingUp, Users } from "lucide-react";
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import {
  adminSubscriptionPlanColumns,
  type SubscriptionPlanTableRow,
} from '@/components/admin/admin-subscriptions-columns'
import { Tabs, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner';
import { AnimatePresence, motion } from "motion/react";
import { formatMoney } from "@/lib/platform-currency";
import { useAdminPlans } from '@/hooks'
import { createAdminPlan, updateAdminPlan, type AdminSubscriptionPlanRow } from '@/lib/http/admin/plans'
import { invalidateAllPlanCaches } from '@/lib/query/invalidate-plan-caches'
import { PlanFeatureMatrix } from '@/components/admin/plan-feature-matrix'
import { PlanLimitFields } from '@/components/admin/plan-limit-fields'
import { parsePlanPriceInput } from '@/lib/subscription/normalize-plan'
import { normalizePlanPeriodLabel } from '@/lib/subscription/plan-period'
import {
  applyPlanLimitsForFeatures,
  validateMainPlanLimitAlignment,
} from '@/lib/subscription/plan-limit-alignment'

const panelTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const },
};

type PlanCard = SubscriptionPlanTableRow & {
  features: string[]
  feature_keys: string[]
  is_popular?: boolean
}

const defaultPlanLimits = (planType: 'main' | 'branch_addon') =>
  planType === 'branch_addon'
    ? { max_branches: 1, max_users: 5, monthly_tx_limit: 2000 }
    : { max_branches: 1, max_users: 5, monthly_tx_limit: 500 }

const planDialogContentClassName =
  'flex max-h-[min(90dvh,calc(100vh-2rem))] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl'

export function AdminSubscriptionsPanel() {
  const queryClient = useQueryClient()
  const plansQuery = useAdminPlans()

  const plans = useMemo((): PlanCard[] => {
    return (plansQuery.data?.plans ?? []).map((plan) => {
      const row = plan as AdminSubscriptionPlanRow
      const rawFeatures = row.features
      let features: string[] = []
      if (Array.isArray(rawFeatures)) {
        features = rawFeatures.map((f) => String(f))
      } else if (typeof rawFeatures === 'string') {
        features = rawFeatures.split(',').map((f) => f.trim()).filter(Boolean)
      }
      return {
        id: row.id,
        name: row.name,
        price: Number(row.price ?? 0),
        period: normalizePlanPeriodLabel(
          row.period as string,
          row.billing_period as string,
          Number(row.price ?? 0),
        ),
        billing_period: String(row.billing_period ?? 'monthly'),
        billing_cadence:
          String(row.billing_period ?? 'monthly') === 'yearly' ? 'yearly' : 'monthly',
        features,
        feature_keys: Array.isArray((row as { feature_keys?: string[] }).feature_keys)
          ? ((row as { feature_keys: string[] }).feature_keys)
          : [],
        users: Number(row.active_subscriber_count ?? 0),
        popular: !!row.is_popular,
        is_popular: !!row.is_popular,
        is_active: row.is_active !== false,
        polar_product_id: String(row.polar_product_id ?? ''),
        plan_type:
          String(row.plan_type ?? 'main').toLowerCase() === 'branch_addon'
            ? 'branch_addon'
            : 'main',
        max_branches: Number(row.max_branches ?? 1),
        max_users: Number(row.max_users ?? 5),
        monthly_tx_limit: Number(row.monthly_tx_limit ?? 500),
      }
    })
  }, [plansQuery.data?.plans])

  const duplicateGroups = plansQuery.data?.duplicateGroups ?? []

  const [isAddingPlan, setIsAddingPlan] = useState(false)
  const [isEditingPlan, setIsEditingPlan] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanCard | null>(null)
  const [editPlanPrice, setEditPlanPrice] = useState('')
  const [newPlanFeatureKeys, setNewPlanFeatureKeys] = useState<string[]>([
    'app.dashboard',
    'pos.access',
    'inventory.access',
    'customers.access',
    'settings.access',
    'billing.self_serve',
  ])
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: '',
    billing_cadence: 'monthly' as 'monthly' | 'yearly',
    features: '',
    plan_type: 'main' as 'main' | 'branch_addon',
    max_branches: '1',
    max_users: '5',
    monthly_tx_limit: '500',
  })

  const [isAddingPlanLoading, setIsAddingPlanLoading] = useState(false)
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null)

  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackTitle, setFeedbackTitle] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackVariant, setFeedbackVariant] = useState<AdminFeedbackVariant>('success')

  const [deactivateConfirm, setDeactivateConfirm] = useState<PlanCard | null>(null)

  const showFeedback = (
    title: string,
    message: string,
    variant: AdminFeedbackVariant = 'success'
  ) => {
    setFeedbackTitle(title)
    setFeedbackMessage(message)
    setFeedbackVariant(variant)
    setFeedbackOpen(true)
  }

  const mainPlans = useMemo(
    () => plans.filter((p) => p.plan_type === 'main'),
    [plans],
  )
  const addonPlans = useMemo(
    () => plans.filter((p) => p.plan_type === 'branch_addon'),
    [plans],
  )
  const totalSubscribers = useMemo(
    () => plans.reduce((s, p) => s + p.users, 0),
    [plans],
  )
  const estimatedMrr = useMemo(
    () =>
      plans.reduce(
        (sum, p) => sum + (p.price > 0 ? p.price * p.users : 0),
        0,
      ),
    [plans],
  )

  const [activeTab, setActiveTab] = useState<"main" | "addons">("main")

  const handleAddPlan = async () => {
    setIsAddingPlanLoading(true)
    try {
      const limits = defaultPlanLimits(newPlan.plan_type)
      const featureKeys = newPlan.plan_type === 'main' ? newPlanFeatureKeys : []
      const alignedLimits = applyPlanLimitsForFeatures({
        feature_keys: featureKeys,
        max_branches: Number(newPlan.max_branches) || limits.max_branches,
        max_users: Number(newPlan.max_users) || limits.max_users,
        monthly_tx_limit: Number(newPlan.monthly_tx_limit) || limits.monthly_tx_limit,
      })
      const limitError = validateMainPlanLimitAlignment({
        plan_type: newPlan.plan_type,
        ...alignedLimits,
      })
      if (limitError) {
        showFeedback('Plan limits mismatch', limitError, 'error')
        return
      }
      const { polarSync } = await createAdminPlan({
        name: newPlan.name,
        price: parseInt(newPlan.price, 10),
        feature_keys: alignedLimits.feature_keys,
        plan_type: newPlan.plan_type,
        billing_period:
          parseInt(newPlan.price, 10) === 0 ? 'free' : newPlan.billing_cadence,
        billing_cadence: newPlan.billing_cadence,
        max_branches: alignedLimits.max_branches,
        max_users: alignedLimits.max_users,
        monthly_tx_limit: alignedLimits.monthly_tx_limit,
      })
      await invalidateAllPlanCaches(queryClient)
      setIsAddingPlan(false)
      setNewPlan({
        name: '',
        price: '',
        billing_cadence: 'monthly',
        features: '',
        plan_type: 'main',
        max_branches: '1',
        max_users: '5',
        monthly_tx_limit: '500',
      })
      if (polarSync?.error) {
        showFeedback(
          'Plan saved',
          `The plan was saved in Pryrox, but Polar sync failed:\n${polarSync.error}`,
          'warning'
        )
      } else if (
        polarSync?.action === 'created' ||
        polarSync?.action === 'updated' ||
        polarSync?.action === 'recreated'
      ) {
        showFeedback('Plan added', 'The plan was saved and synced to Polar.')
      } else {
        showFeedback('Plan added', 'Your new subscription plan is live.')
      }
    } catch (error) {
      console.error('Error adding plan:', error)
      showFeedback(
        'Could not add plan',
        error instanceof Error ? error.message : 'Failed to add plan',
        'error'
      )
    } finally {
      setIsAddingPlanLoading(false)
    }
  }

  const applyTogglePlanActive = async (plan: PlanCard, nextActive: boolean) => {
    setTogglingPlanId(plan.id)
    try {
      await updateAdminPlan(plan.id, { is_active: nextActive })
      await invalidateAllPlanCaches(queryClient)
    } catch (error) {
      console.error('Error updating plan status:', error)
      showFeedback(
        'Update failed',
        error instanceof Error ? error.message : 'Failed to update plan status',
        'error'
      )
    } finally {
      setTogglingPlanId(null)
    }
  }

  const handleTogglePlanActive = (plan: PlanCard, nextActive: boolean) => {
    if (!nextActive && plan.users > 0) {
      setDeactivateConfirm(plan)
      return
    }
    void applyTogglePlanActive(plan, nextActive)
  }

  const planColumns = useMemo(
    () =>
      adminSubscriptionPlanColumns({
        onEdit: (plan) => {
          const p = plan as PlanCard
          const aligned = applyPlanLimitsForFeatures({
            feature_keys: p.feature_keys,
            max_branches: p.max_branches,
            max_users: p.max_users,
            monthly_tx_limit: p.monthly_tx_limit,
          })
          setSelectedPlan({ ...p, ...aligned })
          setEditPlanPrice(String(plan.price))
          setIsEditingPlan(true)
        },
        onToggleActive: (plan, active) =>
          handleTogglePlanActive(plan as PlanCard, active),
        togglingPlanId,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable toggle handler
    [togglingPlanId],
  )

  const handleEditPlan = async () => {
    if (!selectedPlan) return
    const price = parsePlanPriceInput(editPlanPrice)
    if (price === null) {
      showFeedback(
        'Invalid price',
        'Enter a valid price in RWF (0 or greater).',
        'error'
      )
      return
    }
    const alignedLimits = applyPlanLimitsForFeatures({
      feature_keys: selectedPlan.feature_keys,
      max_branches: selectedPlan.max_branches,
      max_users: selectedPlan.max_users,
      monthly_tx_limit: selectedPlan.monthly_tx_limit,
    })
    const savePayload = {
      name: selectedPlan.name,
      price,
      billing_period:
        price === 0 ? 'free' : selectedPlan.billing_cadence,
      billing_cadence: selectedPlan.billing_cadence,
      feature_keys: alignedLimits.feature_keys,
      is_popular: selectedPlan.popular,
      is_active: selectedPlan.is_active,
      plan_type: selectedPlan.plan_type,
      max_branches: alignedLimits.max_branches,
      max_users: alignedLimits.max_users,
      monthly_tx_limit: alignedLimits.monthly_tx_limit,
    }
    const limitError = validateMainPlanLimitAlignment({
      plan_type: savePayload.plan_type,
      max_branches: savePayload.max_branches,
      max_users: savePayload.max_users,
      monthly_tx_limit: savePayload.monthly_tx_limit,
      feature_keys: savePayload.feature_keys,
    })
    if (limitError) {
      showFeedback('Plan limits mismatch', limitError, 'error')
      return
    }
    setIsSavingPlan(true)
    try {
      const data = await updateAdminPlan(selectedPlan.id, savePayload)

      await invalidateAllPlanCaches(queryClient)
      setIsEditingPlan(false)
      setSelectedPlan(null)

      const savedPrice = Number(data.plan?.price ?? price)
      if (data.polarSync?.error) {
        showFeedback(
          'Plan saved',
          `${selectedPlan.name} is now ${savedPrice.toLocaleString()} RWF/month in Pryrox.\n\nPolar sync failed:\n${data.polarSync.error}`,
          'warning'
        )
      } else if (
        data.polarSync?.action === 'created' ||
        data.polarSync?.action === 'updated' ||
        data.polarSync?.action === 'recreated'
      ) {
        showFeedback(
          'Plan updated',
          `${selectedPlan.name} is now ${savedPrice.toLocaleString()} RWF/month and synced to Polar.`
        )
      } else {
        showFeedback(
          'Plan updated',
          `${selectedPlan.name} is now ${savedPrice.toLocaleString()} RWF/month.`
        )
      }
    } catch (error) {
      console.error('Error updating plan:', error)
      showFeedback(
        'Could not save plan',
        error instanceof Error ? error.message : 'Failed to update plan',
        'error'
      )
    } finally {
      setIsSavingPlan(false)
    }
  }

  if (plansQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-6" />
        <p className="text-sm text-neutral-500">Loading subscription catalog…</p>
      </div>
    )
  }

  return (
    <>
      <AdminFeedbackDialog
        open={feedbackOpen}
        onOpenChange={setFeedbackOpen}
        title={feedbackTitle}
        message={feedbackMessage}
        variant={feedbackVariant}
      />

      <AlertDialog
        open={!!deactivateConfirm}
        onOpenChange={(open) => !open && setDeactivateConfirm(null)}
      >
        <DashboardAlertDialogContent>
          <DashboardAlertDialogHeader>
            <DashboardAlertDialogTitle>Deactivate this plan?</DashboardAlertDialogTitle>
            <DashboardAlertDialogDescription>
              {deactivateConfirm
                ? `"${deactivateConfirm.name}" has ${deactivateConfirm.users} active subscriber(s). Deactivating hides it from new signups; existing subscriptions are unchanged.`
                : null}
            </DashboardAlertDialogDescription>
          </DashboardAlertDialogHeader>
          <DashboardAlertDialogActions
            cancelLabel="Cancel"
            confirmLabel="Deactivate"
            onCancel={() => setDeactivateConfirm(null)}
            onConfirm={() => {
              if (deactivateConfirm) {
                void applyTogglePlanActive(deactivateConfirm, false)
              }
              setDeactivateConfirm(null)
            }}
            confirmTone="destructive"
          />
        </DashboardAlertDialogContent>
      </AlertDialog>

          <AdminPageHeader
            pinTitle="Subscription catalog"
            title="Subscription catalog"
            description="Main plans and branch add-ons — subscriber counts use plan_id when available"
            actions={
              <div className="flex flex-wrap items-center gap-2">
                <DashboardButton tone="outline" asChild>
                  <Link href="/admin/stores">View stores</Link>
                </DashboardButton>
                <DashboardButton
                  tone="primary"
                  onClick={() => setIsAddingPlan(true)}
                >
                  <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} />
                  Create plan
                </DashboardButton>
              </div>
            }
          />

          {duplicateGroups.length > 0 ? (
            <div className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-medium">
                {duplicateGroups.length} duplicate plan group
                {duplicateGroups.length === 1 ? '' : 's'} detected
              </p>
              <p className="mt-1">
                Review duplicate plan names and deactivate or merge extras so each
                tier has one active row.
              </p>
            </div>
          ) : null}

          {plansQuery.isError ? (
            <p className="text-sm text-destructive" role="alert">
              {plansQuery.error instanceof Error
                ? plansQuery.error.message
                : 'Could not load plans.'}
            </p>
          ) : null}

          <DashboardMetricGrid className="mb-4">
            <DashboardStatCard
              label="Main plans"
              icon={Layers}
              value={mainPlans.length}
              loading={plansQuery.isPending}
            />
            <DashboardStatCard
              label="Branch add-ons"
              icon={Building2}
              value={addonPlans.length}
              loading={plansQuery.isPending}
            />
            <DashboardStatCard
              label="Active subscribers"
              icon={Users}
              value={totalSubscribers}
              hint="Across all plan tiers"
              loading={plansQuery.isPending}
            />
            <DashboardStatCard
              label="Est. MRR"
              icon={TrendingUp}
              value={formatMoney(estimatedMrr)}
              hint="From active paid subscriptions"
              loading={plansQuery.isPending}
              valueClassName="text-2xl sm:text-3xl"
            />
          </DashboardMetricGrid>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "main" | "addons")}
          >
            <DashboardTabsList>
              <TabsTrigger value="main">
                Main plans ({mainPlans.length})
              </TabsTrigger>
              <TabsTrigger value="addons">
                Branch add-ons ({addonPlans.length})
              </TabsTrigger>
            </DashboardTabsList>

            <AnimatePresence mode="wait">
              {activeTab === "main" ? (
                <motion.div
                  key="main-tab"
                  role="tabpanel"
                  aria-label="Main plans"
                  className="mt-4"
                  {...panelTransition}
                >
              <DashboardDataTable
                title="Main subscription plans"
                description="Pharmacy tier products — not branch slot add-ons"
                searchPlaceholder="Search plans…"
                columns={planColumns}
                data={mainPlans}
                initialSorting={[{ id: 'users', desc: true }]}
                emptyMessage="No main plans yet."
              />
                </motion.div>
              ) : null}

              {activeTab === "addons" ? (
                <motion.div
                  key="addons-tab"
                  role="tabpanel"
                  aria-label="Branch add-ons"
                  className="mt-4"
                  {...panelTransition}
                >
              <DashboardDataTable
                title="Branch add-ons"
                description="Extra location slots — never shown as a pharmacy&apos;s main plan"
                searchPlaceholder="Search add-ons…"
                columns={planColumns}
                data={addonPlans}
                emptyMessage="No branch add-on products yet."
              />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </Tabs>

          <Dialog open={isAddingPlan} onOpenChange={setIsAddingPlan}>
            <DashboardDialogContent className={cn(planDialogContentClassName)}>
              <DashboardDialogHeader className="shrink-0">
                <DashboardDialogTitle>Add plan</DashboardDialogTitle>
                <DashboardDialogDescription>
                  Define pricing, features, and limits for a new catalog entry.
                </DashboardDialogDescription>
              </DashboardDialogHeader>
              <DashboardDialogBody className="min-h-0 max-h-none flex-1 overflow-y-auto">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Plan Name</Label>
                    <Input
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      placeholder="e.g. Starter"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use a unique name. Similar names (e.g. Starter vs stater) are
                      blocked.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Price (RWF)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={newPlan.price}
                      onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Billing cadence</Label>
                    <Select
                      value={newPlan.billing_cadence}
                      disabled={
                        newPlan.price !== "" && parseInt(newPlan.price, 10) === 0
                      }
                      onValueChange={(value: "monthly" | "yearly") =>
                        setNewPlan({ ...newPlan, billing_cadence: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {newPlan.price !== "" && parseInt(newPlan.price, 10) === 0
                        ? "Free plans are stored without a monthly/yearly charge."
                        : "Shown on pricing as /month or /year."}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label>Plan type</Label>
                    <Select
                      value={newPlan.plan_type}
                      onValueChange={(value: "main" | "branch_addon") => {
                        const limits = defaultPlanLimits(value)
                        setNewPlan({
                          ...newPlan,
                          plan_type: value,
                          max_branches: String(limits.max_branches),
                          max_users: String(limits.max_users),
                          monthly_tx_limit: String(limits.monthly_tx_limit),
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Main subscription plan</SelectItem>
                        <SelectItem value="branch_addon">Branch add-on</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newPlan.plan_type === "main" ? (
                    <div className="grid gap-2">
                      <Label>Plan features</Label>
                      <PlanFeatureMatrix
                        selectedKeys={newPlanFeatureKeys}
                        onChange={(keys) => {
                          setNewPlanFeatureKeys(keys)
                          const aligned = applyPlanLimitsForFeatures({
                            feature_keys: keys,
                            max_branches: Number(newPlan.max_branches) || 1,
                            max_users: Number(newPlan.max_users) || 1,
                            monthly_tx_limit: Number(newPlan.monthly_tx_limit) || 0,
                          })
                          setNewPlan({
                            ...newPlan,
                            max_branches: String(aligned.max_branches),
                            max_users: String(aligned.max_users),
                            monthly_tx_limit: String(aligned.monthly_tx_limit),
                          })
                        }}
                      />
                    </div>
                  ) : null}
                  <div className="grid gap-2">
                    <Label>Plan limits</Label>
                    <PlanLimitFields
                      planType={newPlan.plan_type}
                      featureKeys={newPlanFeatureKeys}
                      maxBranches={Number(newPlan.max_branches) || 1}
                      maxUsers={Number(newPlan.max_users) || 1}
                      monthlyTxLimit={Number(newPlan.monthly_tx_limit) || 0}
                      onMaxBranchesChange={(value) =>
                        setNewPlan({ ...newPlan, max_branches: String(value) })
                      }
                      onMaxUsersChange={(value) =>
                        setNewPlan({ ...newPlan, max_users: String(value) })
                      }
                      onMonthlyTxLimitChange={(value) =>
                        setNewPlan({ ...newPlan, monthly_tx_limit: String(value) })
                      }
                    />
                  </div>
                </div>
              </DashboardDialogBody>
              <DashboardDialogActions
                cancelLabel="Cancel"
                confirmLabel="Add plan"
                onCancel={() => setIsAddingPlan(false)}
                onConfirm={() => void handleAddPlan()}
                confirmDisabled={
                  !newPlan.name || newPlan.price === "" || isAddingPlanLoading
                }
                confirmLoading={isAddingPlanLoading}
              />
            </DashboardDialogContent>
          </Dialog>

          <Dialog open={isEditingPlan} onOpenChange={setIsEditingPlan}>
            <DashboardDialogContent className={cn(planDialogContentClassName)}>
              <DashboardDialogHeader className="shrink-0">
                <DashboardDialogTitle>Edit plan</DashboardDialogTitle>
                <DashboardDialogDescription>
                  Update pricing, features, and visibility for this catalog entry.
                </DashboardDialogDescription>
              </DashboardDialogHeader>
              {selectedPlan && (
                <>
                <DashboardDialogBody className="min-h-0 max-h-none flex-1 overflow-y-auto">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Plan Name</Label>
                    <Input
                      value={selectedPlan.name}
                      onChange={(e) => setSelectedPlan({...selectedPlan, name: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Price (RWF)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editPlanPrice}
                      onChange={(e) => setEditPlanPrice(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Billing cadence</Label>
                    <Select
                      value={selectedPlan.billing_cadence}
                      disabled={parseInt(editPlanPrice, 10) === 0}
                      onValueChange={(value: 'monthly' | 'yearly') =>
                        setSelectedPlan({ ...selectedPlan, billing_cadence: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Plan type</Label>
                    <Select
                      value={selectedPlan.plan_type}
                      onValueChange={(value: 'main' | 'branch_addon') =>
                        setSelectedPlan({ ...selectedPlan, plan_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Main subscription plan</SelectItem>
                        <SelectItem value="branch_addon">Branch add-on</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedPlan.plan_type === 'main' ? (
                    <div className="grid gap-2">
                      <Label>Plan features</Label>
                      <PlanFeatureMatrix
                        selectedKeys={selectedPlan.feature_keys}
                        onChange={(keys) =>
                          setSelectedPlan({
                            ...selectedPlan,
                            ...applyPlanLimitsForFeatures({
                              feature_keys: keys,
                              max_branches: selectedPlan.max_branches,
                              max_users: selectedPlan.max_users,
                              monthly_tx_limit: selectedPlan.monthly_tx_limit,
                            }),
                          })
                        }
                      />
                    </div>
                  ) : null}
                  <div className="grid gap-2">
                    <Label>Plan limits</Label>
                    <PlanLimitFields
                      planType={selectedPlan.plan_type}
                      featureKeys={selectedPlan.feature_keys}
                      maxBranches={selectedPlan.max_branches}
                      maxUsers={selectedPlan.max_users}
                      monthlyTxLimit={selectedPlan.monthly_tx_limit}
                      onMaxBranchesChange={(value) =>
                        setSelectedPlan({ ...selectedPlan, max_branches: value })
                      }
                      onMaxUsersChange={(value) =>
                        setSelectedPlan({ ...selectedPlan, max_users: value })
                      }
                      onMonthlyTxLimitChange={(value) =>
                        setSelectedPlan({ ...selectedPlan, monthly_tx_limit: value })
                      }
                    />
                  </div>
                  {selectedPlan.polar_product_id ? (
                    <p className="text-xs text-muted-foreground rounded-md border px-3 py-2">
                      Polar product (auto-synced):{' '}
                      <code className="text-[10px] break-all">{selectedPlan.polar_product_id}</code>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Paid plans sync to Polar when you save. Renaming the plan
                      updates the Polar product title on the next save or sync.
                    </p>
                  )}
                  <div className="flex items-center justify-between rounded-lg border border-neutral-200/80 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40">
                    <Label htmlFor="edit-plan-active" className="cursor-pointer">
                      Active (visible in onboarding and upgrades)
                    </Label>
                    <Switch
                      id="edit-plan-active"
                      checked={selectedPlan.is_active}
                      onCheckedChange={(checked) =>
                        setSelectedPlan({ ...selectedPlan, is_active: checked })
                      }
                    />
                  </div>
                  </div>
                </DashboardDialogBody>
                <DashboardDialogActions
                  cancelLabel="Cancel"
                  confirmLabel="Save changes"
                  onCancel={() => {
                    setIsEditingPlan(false)
                    setSelectedPlan(null)
                  }}
                  onConfirm={() => void handleEditPlan()}
                  confirmLoading={isSavingPlan}
                />
                </>
              )}
            </DashboardDialogContent>
          </Dialog>

    </>
  );
}
