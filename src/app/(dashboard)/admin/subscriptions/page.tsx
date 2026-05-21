'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
<<<<<<< HEAD
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  CreditCard, Plus, Edit, Crown, CheckCircle, Loader2,
  GitBranch, Users, ArrowUpDown, Activity, Ban, RefreshCw,
  PlayCircle, AlertTriangle, Settings2, Zap,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import {
  useSaasPlans, useCreateSaasPlan, useUpdateSaasPlan, saasKeys,
  useAdminSaasSubscriptions,
} from '@/hooks/useSaasSubscription'
import type { SubscriptionPlan } from '@/lib/saas/types'

// ─── Plan form state ───────────────────────────────────────
const emptyForm = {
  name: '',
  description: '',
  price: '',           // monthly price set by admin
  yearly_discount: '17', // % discount for yearly billing (default 17% = ~2 months free)
  billing_period: 'monthly',
  plan_type: 'main',
  max_branches: '1',
  max_users: '5',
  monthly_tx_limit: '500',
  features: '',
  is_popular: false,
}

/** Compute yearly price from monthly + discount % */
function calcYearlyPrice(monthlyStr: string, discountStr: string): number {
  const monthly = Number(monthlyStr) || 0
  const discount = Math.min(100, Math.max(0, Number(discountStr) || 0))
  return Math.round(monthly * 12 * (1 - discount / 100))
}

/** Savings vs paying monthly for 12 months */
function calcYearlySavings(monthlyStr: string, discountStr: string): number {
  const monthly = Number(monthlyStr) || 0
  return Math.round(monthly * 12) - calcYearlyPrice(monthlyStr, discountStr)
}

type SubRow = {
  id: string
  pharmacy?: { name?: string }
  plan?: { name?: string; price?: number }
  subscription_type: string
  status: string
  current_period_end?: string
}

export default function AdminSubscriptionsPage() {
  const qc = useQueryClient()
  const plansQuery = useSaasPlans()
  const subsQuery = useAdminSaasSubscriptions()
  const createPlan = useCreateSaasPlan()
  const updatePlan = useUpdateSaasPlan()

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<SubscriptionPlan | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)
  const [deactivateTarget, setDeactivateTarget] = useState<SubscriptionPlan | null>(null)
  const [suspendTarget, setSuspendTarget] = useState<SubRow | null>(null)
  const [suspendReason, setSuspendReason] = useState('')
  const [reactivateTarget, setReactivateTarget] = useState<SubRow | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [cronLoading, setCronLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const plans = plansQuery.data ?? []
  const allSubs = (subsQuery.data ?? []) as SubRow[]

  const activeSubs = allSubs.filter(s => s.status === 'active').length
  const suspendedSubs = allSubs.filter(s => s.status === 'suspended' || s.status === 'cancelled').length
  const expiredSubs = allSubs.filter(s => s.status === 'expired').length
  const totalRevenue = allSubs
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + Number(s.plan?.price ?? 0), 0)

  const handleCreate = async () => {
    try {
      await createPlan.mutateAsync({
        name: form.name,
        price: Number(form.price),
        yearly_price: form.billing_period !== 'free' && Number(form.price) > 0
          ? calcYearlyPrice(form.price, form.yearly_discount)
          : 0,
        yearly_discount_pct: Number(form.yearly_discount) || 0,
        billing_period: form.billing_period,
        plan_type: form.plan_type,
        max_branches: Number(form.max_branches),
        max_users: Number(form.max_users),
        monthly_tx_limit: Number(form.monthly_tx_limit),
        features: form.features.split(',').map(f => f.trim()).filter(Boolean),
        is_popular: form.is_popular,
      })
      setAddOpen(false)
      setForm(emptyForm)
      showToast('Plan created successfully')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create plan', 'error')
    }
  }

  const openEdit = (plan: SubscriptionPlan) => {
    setEditTarget(plan)
    // Reverse-calculate discount % from stored yearly_price if available
    const storedYearly = plan.yearly_price
    const monthly = plan.price
    let discountPct = '17'
    if (storedYearly && monthly > 0) {
      const computed = Math.round((1 - storedYearly / (monthly * 12)) * 100)
      discountPct = String(Math.max(0, computed))
    }
    if ((plan as SubscriptionPlan & { yearly_discount_pct?: number }).yearly_discount_pct !== undefined) {
      discountPct = String((plan as SubscriptionPlan & { yearly_discount_pct?: number }).yearly_discount_pct)
    }
    setEditForm({
      name: plan.name,
      description: (plan as SubscriptionPlan & { description?: string }).description ?? '',
      price: String(plan.price),
      yearly_discount: discountPct,
      billing_period: plan.billing_period,
      plan_type: plan.plan_type,
      max_branches: String(plan.max_branches),
      max_users: String(plan.max_users),
      monthly_tx_limit: String(plan.monthly_tx_limit),
      features: plan.features.join(', '),
      is_popular: plan.is_popular,
=======

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminFeedbackDialog, type AdminFeedbackVariant } from "@/components/admin/admin-feedback-dialog";
import {
  PolarSyncDialog,
  type PolarSyncPlanResult,
} from "@/components/admin/polar-sync-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Plus, Edit, Crown, CheckCircle, Loader2 } from "lucide-react";
import { Spinner } from '@/components/ui/spinner';
import { adminPlansQueryKey, useAdminPlans } from '@/hooks'
import { createAdminPlan, dedupeAdminPlans, syncAllPlansToPolar, updateAdminPlan, type AdminSubscriptionPlanRow } from '@/lib/http/admin/plans'
import { parsePlanPriceInput } from '@/lib/subscription/normalize-plan'

type PlanCard = {
  id: string
  name: string
  price: number
  period: string
  features: string[]
  users: number
  popular: boolean
  is_popular?: boolean
  is_active: boolean
  polar_product_id: string
}

export default function SubscriptionsPage() {
  const queryClient = useQueryClient()
  const plansQuery = useAdminPlans()

  const plans = useMemo((): PlanCard[] => {
    return (plansQuery.data ?? []).map((plan) => {
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
        period: (row.period as string) || 'per month',
        features,
        users: Number(row.active_subscriber_count ?? 0),
        popular: !!row.is_popular,
        is_popular: !!row.is_popular,
        is_active: row.is_active !== false,
        polar_product_id: String(row.polar_product_id ?? ''),
      }
>>>>>>> 313716b48a93eb34c93cede1cb263a21779e3d51
    })
  }, [plansQuery.data])

  const maxSubscribers = useMemo(
    () => Math.max(...plans.map((p) => p.users), 1),
    [plans],
  )

  const [isAddingPlan, setIsAddingPlan] = useState(false)
  const [isEditingPlan, setIsEditingPlan] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanCard | null>(null)
  const [editPlanPrice, setEditPlanPrice] = useState('')
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: '',
    period: 'per month',
    features: ''
  })

  const [isAddingPlanLoading, setIsAddingPlanLoading] = useState(false)
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null)

  const [dedupeLoading, setDedupeLoading] = useState(false)
  const [polarSyncOpen, setPolarSyncOpen] = useState(false)
  const [polarSyncLoading, setPolarSyncLoading] = useState(false)
  const [polarSyncError, setPolarSyncError] = useState<string | null>(null)
  const [polarSyncStats, setPolarSyncStats] = useState({ synced: 0, failed: 0, skipped: 0 })
  const [polarSyncResults, setPolarSyncResults] = useState<PolarSyncPlanResult[]>([])

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

  const chartData = plans.map((plan) => ({
    plan: plan.name,
    subscribers: plan.users,
    width: Math.max(6, Math.round((plan.users / maxSubscribers) * 100)),
  }))

  const handleRemoveDuplicates = async () => {
    setDedupeLoading(true)
    try {
<<<<<<< HEAD
      await updatePlan.mutateAsync({
        planId: editTarget.id,
        updates: {
          name: editForm.name,
          price: Number(editForm.price),
          yearly_price: editForm.billing_period !== 'free' && Number(editForm.price) > 0
            ? calcYearlyPrice(editForm.price, editForm.yearly_discount)
            : 0,
          yearly_discount_pct: Number(editForm.yearly_discount) || 0,
          billing_period: editForm.billing_period,
          plan_type: editForm.plan_type,
          max_branches: Number(editForm.max_branches),
          max_users: Number(editForm.max_users),
          monthly_tx_limit: Number(editForm.monthly_tx_limit),
          features: editForm.features.split(',').map(f => f.trim()).filter(Boolean),
          is_popular: editForm.is_popular,
        },
      })
      setEditOpen(false)
      setEditTarget(null)
      showToast('Plan updated')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update plan', 'error')
    }
  }

  const handleToggleActive = async (plan: SubscriptionPlan, next: boolean) => {
    if (!next) { setDeactivateTarget(plan); return }
    try {
      await updatePlan.mutateAsync({ planId: plan.id, updates: { is_active: true } })
      void qc.invalidateQueries({ queryKey: saasKeys.plans })
      showToast(`${plan.name} activated`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error')
    }
=======
      const result = await dedupeAdminPlans()
      await queryClient.invalidateQueries({ queryKey: adminPlansQueryKey })
      showFeedback(
        result.deactivated > 0 ? 'Duplicates removed' : 'No duplicates',
        result.message ??
          (result.deactivated > 0
            ? `Deactivated ${result.deactivated} duplicate plan row(s). In Polar, archive extra "${result.duplicateGroupsBefore > 0 ? 'Basic/Standard/Premium' : ''}" products manually if they remain.`
            : 'Each active plan name appears only once in the database.'),
        result.deactivated > 0 ? 'success' : 'warning'
      )
    } catch (error) {
      showFeedback(
        'Could not remove duplicates',
        error instanceof Error ? error.message : 'Dedupe failed',
        'error'
      )
    } finally {
      setDedupeLoading(false)
    }
  }

  const handleSyncAllToPolar = async () => {
    setPolarSyncOpen(true)
    setPolarSyncLoading(true)
    setPolarSyncError(null)
    setPolarSyncResults([])
    setPolarSyncStats({ synced: 0, failed: 0, skipped: 0 })

    try {
      const result = await syncAllPlansToPolar()
      await queryClient.invalidateQueries({ queryKey: adminPlansQueryKey })
      setPolarSyncStats({
        synced: result.synced,
        failed: result.failed,
        skipped: (result as { skipped?: number }).skipped ?? 0,
      })
      setPolarSyncResults((result.results ?? []) as PolarSyncPlanResult[])
    } catch (error) {
      setPolarSyncError(
        error instanceof Error ? error.message : 'Polar sync failed'
      )
    } finally {
      setPolarSyncLoading(false)
    }
  }

  const handleAddPlan = async () => {
    setIsAddingPlanLoading(true)
    try {
      const { polarSync } = await createAdminPlan({
        name: newPlan.name,
        price: parseInt(newPlan.price, 10),
        period: newPlan.period,
        features: newPlan.features.split(',').map(f => f.trim()).filter(Boolean),
      })
      await queryClient.invalidateQueries({ queryKey: adminPlansQueryKey })
      setIsAddingPlan(false)
      setNewPlan({ name: '', price: '', period: 'per month', features: '' })
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
      await queryClient.invalidateQueries({ queryKey: adminPlansQueryKey })
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
>>>>>>> 313716b48a93eb34c93cede1cb263a21779e3d51
  }

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
    setIsSavingPlan(true)
    try {
<<<<<<< HEAD
      await updatePlan.mutateAsync({ planId: deactivateTarget.id, updates: { is_active: false } })
      void qc.invalidateQueries({ queryKey: saasKeys.plans })
      showToast(`${deactivateTarget.name} deactivated`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error')
    } finally { setDeactivateTarget(null) }
  }

  const handleSuspend = async () => {
    if (!suspendTarget) return
    setActionLoading(suspendTarget.id)
    try {
      const res = await fetch(`/api/saas/admin/subscriptions/${suspendTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suspend', reason: suspendReason || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      void qc.invalidateQueries({ queryKey: saasKeys.adminSubscriptions() })
      showToast(`Subscription suspended`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error')
    } finally {
      setActionLoading(null)
      setSuspendTarget(null)
      setSuspendReason('')
    }
  }

  const handleReactivate = async () => {
    if (!reactivateTarget) return
    setActionLoading(reactivateTarget.id)
    try {
      const res = await fetch(`/api/saas/admin/subscriptions/${reactivateTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      void qc.invalidateQueries({ queryKey: saasKeys.adminSubscriptions() })
      showToast(`Subscription reactivated`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error')
    } finally {
      setActionLoading(null)
      setReactivateTarget(null)
    }
  }

  const runCronJobs = async () => {
    setCronLoading(true)
    try {
      const res = await fetch('/api/saas/admin/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: ['expiry', 'warnings', 'usage_warnings'] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      void qc.invalidateQueries({ queryKey: saasKeys.adminSubscriptions() })
      showToast('Lifecycle jobs completed')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Jobs failed', 'error')
    } finally { setCronLoading(false) }
  }

  if (plansQuery.isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-blue-600" />
            Subscription Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage plans, monitor subscriptions, control access</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void runCronJobs()} disabled={cronLoading}>
            {cronLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Run Lifecycle Jobs
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Plan</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Subscription Plan</DialogTitle></DialogHeader>
              <PlanForm form={form} setForm={setForm} />
              <Button onClick={() => void handleCreate()} disabled={createPlan.isPending || !form.name || !form.price} className="w-full mt-2">
                {createPlan.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Create Plan
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={<CreditCard className="h-5 w-5 text-blue-500" />} label="Total Plans" value={plans.length} />
        <StatCard icon={<Activity className="h-5 w-5 text-green-500" />} label="Active" value={activeSubs} />
        <StatCard icon={<Ban className="h-5 w-5 text-red-500" />} label="Suspended" value={suspendedSubs} />
        <StatCard icon={<AlertTriangle className="h-5 w-5 text-amber-500" />} label="Expired" value={expiredSubs} />
        <StatCard icon={<ArrowUpDown className="h-5 w-5 text-purple-500" />} label="MRR (RWF)" value={totalRevenue.toLocaleString()} />
      </div>

      {/* Plans grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} onEdit={() => openEdit(plan)} onToggle={(next) => void handleToggleActive(plan, next)} />
          ))}
        </div>
      </div>

      {/* All subscriptions table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Subscriptions</CardTitle>
              <CardDescription>Every subscription across all pharmacies — suspend or reactivate as needed</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => void subsQuery.refetch()} disabled={subsQuery.isFetching}>
              <RefreshCw className={`h-4 w-4 mr-2 ${subsQuery.isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subsQuery.isPending ? (
            <div className="flex justify-center py-8"><Spinner className="size-5" /></div>
          ) : allSubs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No subscriptions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4">Pharmacy</th>
                    <th className="pb-2 pr-4">Plan</th>
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Price</th>
                    <th className="pb-2 pr-4">Period End</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allSubs.map(s => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-4 font-medium">{s.pharmacy?.name ?? '—'}</td>
                      <td className="py-2 pr-4">{s.plan?.name ?? '—'}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={s.subscription_type === 'main' ? 'default' : 'secondary'}>
                          {s.subscription_type}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4"><StatusBadge status={s.status} /></td>
                      <td className="py-2 pr-4">RWF {Number(s.plan?.price ?? 0).toLocaleString()}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-1">
                          {s.status === 'active' ? (
                            <Button size="sm" variant="outline" className="h-7 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => setSuspendTarget(s)} disabled={actionLoading === s.id}>
                              {actionLoading === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3 mr-1" />}
                              Suspend
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="h-7 text-green-600 border-green-200 hover:bg-green-50"
                              onClick={() => setReactivateTarget(s)} disabled={actionLoading === s.id}>
                              {actionLoading === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <PlayCircle className="h-3 w-3 mr-1" />}
                              Reactivate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Plan — {editTarget?.name}</DialogTitle></DialogHeader>
          <PlanForm form={editForm} setForm={setEditForm} />
          <Button onClick={() => void handleEdit()} disabled={updatePlan.isPending} className="w-full mt-2">
            {updatePlan.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirm */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={o => !o && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {deactivateTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This plan will be hidden from new signups. Existing subscriptions are unaffected.</AlertDialogDescription>
=======
      const data = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedPlan.name,
          price,
          period: selectedPlan.period,
          features: selectedPlan.features,
          is_popular: selectedPlan.popular,
          is_active: selectedPlan.is_active,
        }),
      }).then((r) => r.json())

      if (!data.success) {
        throw new Error(data.error || 'Failed to update plan')
      }

      await queryClient.invalidateQueries({ queryKey: adminPlansQueryKey })
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
          `${selectedPlan.name} is now ${savedPrice.toLocaleString()} RWF/month. Pharmacies will see this after they refresh Settings.`
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

  if (plansQuery.isPending) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  return (
    <div className="p-6">
      <PolarSyncDialog
        open={polarSyncOpen}
        onOpenChange={setPolarSyncOpen}
        loading={polarSyncLoading}
        error={polarSyncError}
        synced={polarSyncStats.synced}
        failed={polarSyncStats.failed}
        skipped={polarSyncStats.skipped}
        results={polarSyncResults}
      />

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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateConfirm
                ? `"${deactivateConfirm.name}" has ${deactivateConfirm.users} active subscriber(s). Deactivating hides it from new signups; existing subscriptions are unchanged.`
                : null}
            </AlertDialogDescription>
>>>>>>> 313716b48a93eb34c93cede1cb263a21779e3d51
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deactivateConfirm) {
                  void applyTogglePlanActive(deactivateConfirm, false)
                }
                setDeactivateConfirm(null)
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

<<<<<<< HEAD
      {/* Suspend confirm */}
      <AlertDialog open={!!suspendTarget} onOpenChange={o => !o && setSuspendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {suspendTarget?.pharmacy?.name ?? 'this'} subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              The pharmacy will be suspended immediately. Staff will lose access. An email notification will be sent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2">
            <Label className="text-sm">Reason (optional)</Label>
            <Input className="mt-1" placeholder="e.g. Payment overdue" value={suspendReason} onChange={e => setSuspendReason(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => void handleSuspend()}>
              Suspend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate confirm */}
      <AlertDialog open={!!reactivateTarget} onOpenChange={o => !o && setReactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate {reactivateTarget?.pharmacy?.name ?? 'this'} subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              The subscription will be reactivated for 1 month from today. The pharmacy owner will receive a confirmation email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-green-600 hover:bg-green-700" onClick={() => void handleReactivate()}>
              Reactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PlanCard({ plan, onEdit, onToggle }: { plan: SubscriptionPlan; onEdit: () => void; onToggle: (next: boolean) => void }) {
  // Use exactly what the admin stored — no fallback calculations
  const yearlyPrice = plan.yearly_price ?? 0
  const discountPct = (plan as SubscriptionPlan & { yearly_discount_pct?: number }).yearly_discount_pct ?? 0
  const yearlySavings = plan.price > 0 && yearlyPrice > 0
    ? Math.round(plan.price * 12) - yearlyPrice
    : 0
  // Only show yearly block if it's a paid plan with a real yearly price stored
  const showYearly = plan.price > 0 && yearlyPrice > 0

  return (
    <Card className={`relative ${plan.is_popular ? 'border-2 border-blue-600' : ''} ${!plan.is_active ? 'opacity-60' : ''}`}>
      {plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-3"><Crown className="h-3 w-3 mr-1" />Most Popular</Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          <Badge variant={plan.plan_type === 'main' ? 'default' : 'secondary'}>
            {plan.plan_type === 'main' ? 'Main Plan' : 'Branch Add-on'}
          </Badge>
        </div>

        {/* Monthly price */}
        <div className="text-3xl font-bold">
          {plan.price === 0 ? 'Free' : `RWF ${Number(plan.price).toLocaleString()}`}
          {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/month</span>}
        </div>

        {/* Yearly pricing block — only for paid plans with a stored yearly price */}
        {showYearly && (
          <div className="mt-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-green-800">Yearly billing</span>
              {discountPct > 0 && (
                <span className="text-xs font-bold text-green-700 bg-green-200 rounded-full px-2 py-0.5">
                  -{discountPct}% off
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-green-900">
                RWF {yearlyPrice.toLocaleString()}/year
              </span>
              {yearlySavings > 0 && (
                <span className="text-xs text-green-700">
                  Save RWF {yearlySavings.toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-[10px] text-green-600">
              ≈ RWF {Math.round(yearlyPrice / 12).toLocaleString()}/month billed annually
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-muted rounded-md p-2">
            <GitBranch className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <div className="font-bold">{plan.max_branches}</div>
            <div className="text-muted-foreground">Branches</div>
          </div>
          <div className="bg-muted rounded-md p-2">
            <Users className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <div className="font-bold">{plan.max_users}</div>
            <div className="text-muted-foreground">Users</div>
          </div>
          <div className="bg-muted rounded-md p-2">
            <Activity className="h-4 w-4 mx-auto mb-1 text-purple-500" />
            <div className="font-bold">{plan.monthly_tx_limit.toLocaleString()}</div>
            <div className="text-muted-foreground">Tx/mo</div>
          </div>
        </div>
        <ul className="space-y-1">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />{f}
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Switch checked={plan.is_active} onCheckedChange={onToggle} id={`active-${plan.id}`} />
            <Label htmlFor={`active-${plan.id}`} className="text-xs cursor-pointer">
              {plan.is_active ? 'Active' : 'Inactive'}
            </Label>
          </div>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5 mr-1" />Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PlanForm({ form, setForm }: { form: typeof emptyForm; setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>> }) {
  const set = (key: keyof typeof emptyForm, val: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const monthly = Number(form.price) || 0
  const discount = Math.min(100, Math.max(0, Number(form.yearly_discount) || 0))
  const yearlyFull = monthly * 12
  const yearlyDiscounted = Math.round(yearlyFull * (1 - discount / 100))
  const savings = yearlyFull - yearlyDiscounted
  const effectiveMonthly = monthly > 0 ? Math.round(yearlyDiscounted / 12) : 0
  const isPaid = form.billing_period !== 'free' && monthly > 0

  return (
    <div className="grid gap-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Plan Name</Label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Standard" />
        </div>
        <div className="space-y-1">
          <Label>Billing Period</Label>
          <Select value={form.billing_period} onValueChange={v => set('billing_period', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Description (optional)</Label>
        <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="Short plan description" />
      </div>

      {/* Pricing section */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pricing</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Monthly Price (RWF)</Label>
            <Input
              type="number" min={0}
              value={form.price}
              onChange={e => set('price', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label>Yearly Discount (%)</Label>
            <Input
              type="number" min={0} max={100}
              value={form.yearly_discount}
              onChange={e => set('yearly_discount', e.target.value)}
              placeholder="17"
              disabled={!isPaid}
            />
          </div>
        </div>

        {/* Live yearly calculation preview */}
        {isPaid && (
          <div className="rounded-md bg-green-50 border border-green-200 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-green-800">Yearly billing — auto-calculated</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-muted-foreground">Monthly × 12</span>
              <span className="font-medium">RWF {yearlyFull.toLocaleString()}</span>

              <span className="text-muted-foreground">Discount ({discount}%)</span>
              <span className="font-medium text-red-600">− RWF {savings.toLocaleString()}</span>

              <span className="text-green-800 font-semibold">Yearly price</span>
              <span className="font-bold text-green-900">RWF {yearlyDiscounted.toLocaleString()}</span>

              <span className="text-muted-foreground">Effective monthly</span>
              <span className="font-medium">RWF {effectiveMonthly.toLocaleString()}/mo</span>
            </div>
            {savings > 0 && (
              <p className="text-[11px] text-green-700 font-medium">
                Customer saves RWF {savings.toLocaleString()} by choosing yearly
              </p>
            )}
          </div>
        )}

        {form.billing_period === 'free' && (
          <p className="text-xs text-muted-foreground">Free plans have no pricing.</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Plan Type</Label>
          <Select value={form.plan_type} onValueChange={v => set('plan_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Main Plan</SelectItem>
              <SelectItem value="branch_addon">Branch Add-on</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Tx Limit/mo</Label>
          <Input type="number" min={1} value={form.monthly_tx_limit} onChange={e => set('monthly_tx_limit', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Max Branches</Label>
          <Input type="number" min={1} value={form.max_branches} onChange={e => set('max_branches', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Max Users</Label>
          <Input type="number" min={1} value={form.max_users} onChange={e => set('max_users', e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Features (comma-separated)</Label>
        <Textarea
          value={form.features}
          onChange={e => set('features', e.target.value)}
          placeholder="Full POS, Insurance billing, Advanced reports, Multi-branch"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={form.is_popular} onCheckedChange={v => set('is_popular', v)} id="is-popular" />
        <Label htmlFor="is-popular" className="cursor-pointer">Mark as Most Popular</Label>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:    'bg-green-100 text-green-700',
    pending:   'bg-yellow-100 text-yellow-700',
    cancelled: 'bg-gray-100 text-gray-600',
    expired:   'bg-red-100 text-red-700',
    past_due:  'bg-orange-100 text-orange-700',
    suspended: 'bg-red-100 text-red-700',
    trialing:  'bg-blue-100 text-blue-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
=======

        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-blue-600" />
              Subscription Plans
            </h1>
            <p className="text-gray-600">Manage pricing and subscription plans</p>
            {plansQuery.isError ? (
              <p className="text-sm text-destructive mt-2" role="alert">
                {plansQuery.error instanceof Error ? plansQuery.error.message : 'Could not load plans.'}
              </p>
            ) : null}
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Subscription Analytics</CardTitle>
              <CardDescription>
                Active rows in the subscriptions table (is_active), grouped by plan name.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartData.map((data, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-20 text-sm font-medium">{data.plan}</div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded h-0.5">
                        <div 
                          className="bg-gray-800 h-0.5 rounded transition-all duration-500"
                          style={{ width: `${data.width}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-xs font-medium">{data.subscribers}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? 'border-2 border-gray-800' : ''} ${!plan.is_active ? 'opacity-60' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gray-800 text-white px-3 py-1">
                      <Crown className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    RWF {plan.price.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.users} active subscribers</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <Label htmlFor={`active-${plan.id}`} className="text-sm cursor-pointer">
                        Offer to new pharmacies
                      </Label>
                      <Switch
                        id={`active-${plan.id}`}
                        checked={plan.is_active}
                        disabled={togglingPlanId === plan.id}
                        onCheckedChange={(checked) =>
                          handleTogglePlanActive(plan, checked)
                        }
                      />
                    </div>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        setSelectedPlan(plan)
                        setEditPlanPrice(String(plan.price))
                        setIsEditingPlan(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plan Management</CardTitle>
                  <CardDescription>Create and manage subscription plans</CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={dedupeLoading || polarSyncLoading}
                    onClick={() => void handleRemoveDuplicates()}
                  >
                    {dedupeLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cleaning…
                      </>
                    ) : (
                      'Remove duplicates'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={polarSyncLoading || dedupeLoading}
                    onClick={() => void handleSyncAllToPolar()}
                  >
                    {polarSyncLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Syncing…
                      </>
                    ) : (
                      'Sync all to Polar'
                    )}
                  </Button>
                <Dialog open={isAddingPlan} onOpenChange={setIsAddingPlan}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Plan</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Plan Name</Label>
                        <Input
                          value={newPlan.name}
                          onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Price (RWF)</Label>
                        <Input
                          type="number"
                          value={newPlan.price}
                          onChange={(e) => setNewPlan({...newPlan, price: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Features (comma separated)</Label>
                        <Textarea
                          value={newPlan.features}
                          onChange={(e) => setNewPlan({...newPlan, features: e.target.value})}
                          placeholder="Feature 1, Feature 2, Feature 3"
                        />
                      </div>
                      <Button
                        onClick={() => void handleAddPlan()}
                        disabled={!newPlan.name || !newPlan.price || isAddingPlanLoading}
                      >
                        {isAddingPlanLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          'Add Plan'
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={isEditingPlan} onOpenChange={setIsEditingPlan}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Plan</DialogTitle>
              </DialogHeader>
              {selectedPlan && (
                <div className="grid gap-4 py-4">
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
                    <Label>Features (comma separated)</Label>
                    <Textarea
                      value={selectedPlan.features.join(', ')}
                      onChange={(e) => setSelectedPlan({...selectedPlan, features: e.target.value.split(',').map(f => f.trim())})}
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
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
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
                  <Button
                    onClick={() => void handleEditPlan()}
                    disabled={isSavingPlan}
                  >
                    {isSavingPlan ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

    </div>
  );
>>>>>>> 313716b48a93eb34c93cede1cb263a21779e3d51
}
