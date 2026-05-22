'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PolarSyncDialog, type PolarSyncPlanResult } from "@/components/admin/polar-sync-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  CreditCard, Plus, Edit, Crown, CheckCircle,
  Loader2, LayoutList, LayoutGrid, Sparkles,
} from "lucide-react"
import { Spinner } from '@/components/ui/spinner'
import { adminPlansQueryKey, useAdminPlans } from '@/hooks'
import {
  createAdminPlan, dedupeAdminPlans, syncAllPlansToPolar,
  updateAdminPlan, type AdminSubscriptionPlanRow,
} from '@/lib/http/admin/plans'
import { parsePlanPriceInput } from '@/lib/subscription/normalize-plan'
import { PlansTable } from '@/components/subscription'
import {
  FEATURE_LABELS, FEATURE_CANONICAL, VALID_FEATURE_STRINGS, type FeatureKey,
} from '@/lib/saas/feature-access'

// ─── All system-defined features ──────────────────────────────
const SYSTEM_FEATURES = Object.entries(FEATURE_LABELS) as [FeatureKey, string][]

/** Keep only features that are valid canonical strings, normalise casing. */
function sanitiseFeatures(raw: string[]): string[] {
  const canonicalMap = new Map(
    Object.values(FEATURE_CANONICAL).map(v => [v.toLowerCase(), v])
  )
  return raw
    .filter(f => VALID_FEATURE_STRINGS.has(f.toLowerCase()))
    .map(f => canonicalMap.get(f.toLowerCase()) ?? f)
}

type PlanCard = {
  id: string
  name: string
  price: number
  yearly_price: number
  yearly_discount_pct: number
  period: string
  billing_period: string
  plan_type: string
  max_branches: number
  max_users: number
  monthly_tx_limit: number
  features: string[]
  users: number
  popular: boolean
  is_popular?: boolean
  is_active: boolean
  polar_product_id: string
}

type PlanForm = {
  name: string
  price: string
  yearly_discount_pct: string   // 0–100, empty = no discount (0%)
  billing_period: string
  plan_type: string
  max_branches: string
  max_users: string
  monthly_tx_limit: string
  features: string[]
  is_popular: boolean
}

const DEFAULT_FORM: PlanForm = {
  name: '',
  price: '',
  yearly_discount_pct: '',
  billing_period: 'monthly',
  plan_type: 'main',
  max_branches: '1',
  max_users: '5',
  monthly_tx_limit: '500',
  features: [],
  is_popular: false,
}

// ─── Shared plan form fields component ────────────────────────
function PlanFormFields({
  form,
  onChange,
}: {
  form: PlanForm
  onChange: (patch: Partial<PlanForm>) => void
}) {
  // Live-compute yearly price exactly as the DB trigger does
  const monthly = Number(form.price) || 0
  const discount = Math.min(100, Math.max(0, Number(form.yearly_discount_pct) || 0))
  const yearlyPrice = form.billing_period === 'free' || monthly === 0
    ? 0
    : Math.round(monthly * 12 * (1 - discount / 100))

  return (
    <div className="grid gap-4">
      {/* Name */}
      <div className="grid gap-1.5">
        <Label>Plan Name</Label>
        <Input value={form.name} onChange={e => onChange({ name: e.target.value })} />
      </div>

      {/* Monthly price */}
      <div className="grid gap-1.5">
        <Label>Monthly Price (RWF)</Label>
        <Input
          type="number" min={0}
          value={form.price}
          onChange={e => onChange({ price: e.target.value })}
          placeholder="e.g. 50000"
        />
      </div>

      {/* Yearly discount + auto-calculated yearly price */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>
            Yearly Discount (%)
            <span className="ml-1 text-xs text-muted-foreground">optional</span>
          </Label>
          <Input
            type="number" min={0} max={100}
            value={form.yearly_discount_pct}
            onChange={e => onChange({ yearly_discount_pct: e.target.value })}
            placeholder="e.g. 17"
          />
        </div>
        <div className="grid gap-1.5">
          <Label>Yearly Price (auto-calculated)</Label>
          <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground select-none">
            {monthly === 0 || form.billing_period === 'free'
              ? '—'
              : `RWF ${yearlyPrice.toLocaleString()}`}
          </div>
          {discount > 0 && monthly > 0 && form.billing_period !== 'free' && (
            <p className="text-xs text-green-600">
              Saves RWF {(monthly * 12 - yearlyPrice).toLocaleString()} vs monthly
            </p>
          )}
        </div>
      </div>

      {/* Billing period + Plan type */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Billing Period</Label>
          <Select value={form.billing_period} onValueChange={v => onChange({ billing_period: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="free">Free</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Plan Type</Label>
          <Select value={form.plan_type} onValueChange={v => onChange({ plan_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Main</SelectItem>
              <SelectItem value="branch_addon">Branch Add-on</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Limits */}
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Limits</p>
      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-1.5">
          <Label>Max Branches</Label>
          <Input type="number" min={1} value={form.max_branches}
            onChange={e => onChange({ max_branches: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Max Staff</Label>
          <Input type="number" min={1} value={form.max_users}
            onChange={e => onChange({ max_users: e.target.value })} />
        </div>
        <div className="grid gap-1.5">
          <Label>Tx / Month</Label>
          <Input type="number" min={0} value={form.monthly_tx_limit}
            onChange={e => onChange({ monthly_tx_limit: e.target.value })} />
        </div>
      </div>

      <Separator />

      {/* Features */}
      <div className="grid gap-1.5">
        <Label>Features</Label>
        <p className="text-xs text-muted-foreground">
          Select the system features included in this plan.
        </p>
        <ScrollArea className="h-48 rounded-md border p-3">
          <div className="space-y-2">
            {SYSTEM_FEATURES.map(([key, label]) => {
              const canonical = FEATURE_CANONICAL[key]
              const checked = form.features.some(
                f => f.toLowerCase() === canonical.toLowerCase()
              )
              return (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox
                    id={`feature-${key}`}
                    checked={checked}
                    onCheckedChange={c =>
                      onChange({
                        features: c
                          ? [...form.features, canonical]
                          : form.features.filter(f => f.toLowerCase() !== canonical.toLowerCase()),
                      })
                    }
                  />
                  <Label htmlFor={`feature-${key}`} className="text-sm font-normal cursor-pointer">
                    {label}
                  </Label>
                </div>
              )
            })}
          </div>
        </ScrollArea>
        <p className="text-xs text-muted-foreground">
          {form.features.length} feature{form.features.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      {/* Popular toggle */}
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <Label htmlFor="form-popular" className="cursor-pointer text-sm">
          Mark as most popular
        </Label>
        <Switch
          id="form-popular"
          checked={form.is_popular}
          onCheckedChange={v => onChange({ is_popular: v })}
        />
      </div>
    </div>
  )
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
        features = (rawFeatures as string).split(',').map((f) => f.trim()).filter(Boolean)
      }
      return {
        id: row.id,
        name: row.name,
        price: Number(row.price ?? 0),
        yearly_price: Number((row as Record<string, unknown>).yearly_price ?? 0),
        yearly_discount_pct: Number((row as Record<string, unknown>).yearly_discount_pct ?? 0),
        period: (row.period as string) || 'per month',
        billing_period: String((row as Record<string, unknown>).billing_period ?? 'monthly'),
        plan_type: String((row as Record<string, unknown>).plan_type ?? 'main'),
        max_branches: Number((row as Record<string, unknown>).max_branches ?? 1),
        max_users: Number((row as Record<string, unknown>).max_users ?? 5),
        monthly_tx_limit: Number((row as Record<string, unknown>).monthly_tx_limit ?? 500),
        features,
        users: Number(row.active_subscriber_count ?? 0),
        popular: !!row.is_popular,
        is_popular: !!row.is_popular,
        is_active: row.is_active !== false,
        polar_product_id: String((row as Record<string, unknown>).polar_product_id ?? ''),
      }
    })
  }, [plansQuery.data])

  const maxSubscribers = useMemo(
    () => Math.max(...plans.map((p) => p.users), 1),
    [plans],
  )

  // ─── State ────────────────────────────────────────────────
  const [isAddingPlan, setIsAddingPlan] = useState(false)
  const [newForm, setNewForm] = useState<PlanForm>(DEFAULT_FORM)

  const [isEditingPlan, setIsEditingPlan] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<PlanForm>(DEFAULT_FORM)
  const [editIsActive, setEditIsActive] = useState(true)
  const [editPolarId, setEditPolarId] = useState('')

  const [isAddingPlanLoading, setIsAddingPlanLoading] = useState(false)
  const [isSavingPlan, setIsSavingPlan] = useState(false)
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null)
  const [dedupeLoading, setDedupeLoading] = useState(false)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [polarSyncOpen, setPolarSyncOpen] = useState(false)
  const [polarSyncLoading, setPolarSyncLoading] = useState(false)
  const [polarSyncError, setPolarSyncError] = useState<string | null>(null)
  const [polarSyncStats, setPolarSyncStats] = useState({ synced: 0, failed: 0, skipped: 0 })
  const [polarSyncResults, setPolarSyncResults] = useState<PolarSyncPlanResult[]>([])
  const [deactivateConfirm, setDeactivateConfirm] = useState<PlanCard | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  const chartData = plans.map((plan) => ({
    plan: plan.name,
    subscribers: plan.users,
    width: Math.max(6, Math.round((plan.users / maxSubscribers) * 100)),
  }))

  // ─── Open edit dialog — sanitise features on load ─────────
  const openEdit = (plan: PlanCard) => {
    setEditingId(plan.id)
    setEditIsActive(plan.is_active)
    setEditPolarId(plan.polar_product_id)
    setEditForm({
      name: plan.name,
      price: String(plan.price),
      yearly_discount_pct: plan.yearly_discount_pct > 0 ? String(plan.yearly_discount_pct) : '',
      billing_period: plan.billing_period || 'monthly',
      plan_type: plan.plan_type || 'main',
      max_branches: String(plan.max_branches),
      max_users: String(plan.max_users),
      monthly_tx_limit: String(plan.monthly_tx_limit),
      features: sanitiseFeatures(plan.features),
      is_popular: plan.popular,
    })
    setIsEditingPlan(true)
  }

  // ─── Handlers ─────────────────────────────────────────────

  const handleRemoveDuplicates = async () => {
    setDedupeLoading(true)
    const tid = toast.loading('Removing duplicate plans…')
    try {
      const result = await dedupeAdminPlans()
      await queryClient.invalidateQueries({ queryKey: adminPlansQueryKey })
      if (result.deactivated > 0) {
        toast.success('Duplicates removed', {
          id: tid,
          description: result.message ?? `Deactivated ${result.deactivated} duplicate plan row(s).`,
        })
      } else {
        toast.info('No duplicates found', {
          id: tid,
          description: 'Each active plan name appears only once in the database.',
        })
      }
    } catch (error) {
      toast.error('Could not remove duplicates', {
        id: tid,
        description: error instanceof Error ? error.message : 'Dedupe failed',
      })
    } finally {
      setDedupeLoading(false)
    }
  }

  const handleCleanupFeatures = async () => {
    setCleanupLoading(true)
    const tid = toast.loading('Cleaning up invalid features…')
    try {
      const res = await fetch('/api/admin/plans/cleanup-features', { method: 'POST' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? 'Cleanup failed')
      await queryClient.invalidateQueries({ queryKey: adminPlansQueryKey })
      if (data.updated > 0) {
        const detail = (data.plans as { name: string; removed: string[] }[])
          .filter(p => p.removed.length > 0)
          .map(p => `${p.name}: removed "${p.removed.join('", "')}"`)
          .join('\n')
        toast.success(`Cleaned ${data.updated} plan(s)`, {
          id: tid,
          description: detail || 'Invalid feature strings removed and canonical names applied.',
        })
      } else {
        toast.info('All features are valid', {
          id: tid,
          description: 'No invalid feature strings found in any plan.',
        })
      }
    } catch (error) {
      toast.error('Cleanup failed', {
        id: tid,
        description: error instanceof Error ? error.message : 'Could not clean up features',
      })
    } finally {
      setCleanupLoading(false)
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
      setPolarSyncError(error instanceof Error ? error.message : 'Polar sync failed')
    } finally {
      setPolarSyncLoading(false)
    }
  }

  const handleAddPlan = async () => {
    if (!newForm.name.trim() || !newForm.price) return
    setIsAddingPlanLoading(true)
    const tid = toast.loading('Creating plan…')
    try {
      const { polarSync } = await createAdminPlan({
        name: newForm.name.trim(),
        price: Number(newForm.price),
        yearly_discount_pct: newForm.yearly_discount_pct ? Number(newForm.yearly_discount_pct) : 0,
        billing_period: newForm.billing_period,
        plan_type: newForm.plan_type,
        max_branches: Number(newForm.max_branches) || 1,
        max_users: Number(newForm.max_users) || 5,
        monthly_tx_limit: Number(newForm.monthly_tx_limit) || 500,
        features: newForm.features,
        is_popular: newForm.is_popular,
      })
      await queryClient.invalidateQueries({ queryKey: adminPlansQueryKey })
      setIsAddingPlan(false)
      setNewForm(DEFAULT_FORM)
      if (polarSync?.error) {
        toast.warning('Plan saved (Polar sync failed)', { id: tid, description: polarSync.error })
      } else if (['created', 'updated', 'recreated'].includes(polarSync?.action ?? '')) {
        toast.success('Plan added', { id: tid, description: 'Saved and synced to Polar.' })
      } else {
        toast.success('Plan added', { id: tid, description: 'Your new subscription plan is live.' })
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to add plan'
      const isDuplicate = msg.toLowerCase().includes('already exists')
      toast.error(isDuplicate ? msg : 'Could not add plan', {
        id: tid,
        description: isDuplicate ? 'Choose a different plan name.' : msg,
        duration: 6000,
      })
    } finally {
      setIsAddingPlanLoading(false)
    }
  }

  const applyTogglePlanActive = async (plan: PlanCard, nextActive: boolean) => {
    setTogglingPlanId(plan.id)
    try {
      await updateAdminPlan(plan.id, { is_active: nextActive })
      await queryClient.invalidateQueries({ queryKey: adminPlansQueryKey })
      toast.success(nextActive ? 'Plan activated' : 'Plan deactivated', {
        description: `"${plan.name}" is now ${nextActive ? 'visible to new pharmacies' : 'hidden from new signups'}.`,
      })
    } catch (error) {
      toast.error('Update failed', {
        description: error instanceof Error ? error.message : 'Failed to update plan status',
      })
    } finally {
      setTogglingPlanId(null)
    }
  }

  const handleTogglePlanActive = (plan: PlanCard, nextActive: boolean) => {
    if (!nextActive && plan.users > 0) { setDeactivateConfirm(plan); return }
    void applyTogglePlanActive(plan, nextActive)
  }

  const handleEditPlan = async () => {
    if (!editingId) return
    const price = parsePlanPriceInput(editForm.price)
    if (price === null) {
      toast.error('Invalid price', { description: 'Enter a valid price in RWF (0 or greater).' })
      return
    }
    setIsSavingPlan(true)
    const tid = toast.loading('Saving plan…')
    try {
      const data = await fetch(`/api/admin/plans/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          price,
          yearly_discount_pct: editForm.yearly_discount_pct ? Number(editForm.yearly_discount_pct) : 0,
          billing_period: editForm.billing_period,
          plan_type: editForm.plan_type,
          max_branches: Number(editForm.max_branches) || 1,
          max_users: Number(editForm.max_users) || 5,
          monthly_tx_limit: Number(editForm.monthly_tx_limit) || 500,
          features: editForm.features,
          is_popular: editForm.is_popular,
          is_active: editIsActive,
        }),
      }).then(r => r.json())

      if (!data.success) throw new Error(data.error || 'Failed to update plan')

      await queryClient.invalidateQueries({ queryKey: adminPlansQueryKey })
      setIsEditingPlan(false)
      setEditingId(null)

      const savedPrice = Number(data.plan?.price ?? price)
      if (data.polarSync?.error) {
        toast.warning('Plan saved (Polar sync failed)', {
          id: tid,
          description: `${editForm.name} → ${savedPrice.toLocaleString()} RWF.\n${data.polarSync.error}`,
        })
      } else if (['created', 'updated', 'recreated'].includes(data.polarSync?.action ?? '')) {
        toast.success('Plan updated', {
          id: tid,
          description: `${editForm.name} → ${savedPrice.toLocaleString()} RWF, synced to Polar.`,
        })
      } else {
        toast.success('Plan updated', {
          id: tid,
          description: `${editForm.name} → ${savedPrice.toLocaleString()} RWF.`,
        })
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update plan'
      // Show duplicate-name errors as the main title so they're impossible to miss
      const isDuplicate = msg.toLowerCase().includes('already exists')
      toast.error(isDuplicate ? msg : 'Could not save plan', {
        id: tid,
        description: isDuplicate ? 'Rename this plan or edit the existing one.' : msg,
        duration: 6000,
      })
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
        open={polarSyncOpen} onOpenChange={setPolarSyncOpen}
        loading={polarSyncLoading} error={polarSyncError}
        synced={polarSyncStats.synced} failed={polarSyncStats.failed}
        skipped={polarSyncStats.skipped} results={polarSyncResults}
      />

      <AlertDialog open={!!deactivateConfirm} onOpenChange={o => !o && setDeactivateConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this plan?</AlertDialogTitle>
            <AlertDialogDescription>
              {deactivateConfirm
                ? `"${deactivateConfirm.name}" has ${deactivateConfirm.users} active subscriber(s). Deactivating hides it from new signups; existing subscriptions are unchanged.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (deactivateConfirm) void applyTogglePlanActive(deactivateConfirm, false)
              setDeactivateConfirm(null)
            }}>Deactivate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <CreditCard className="h-8 w-8 text-blue-600" />
                Subscription Plans
              </h1>
              <p className="text-gray-600">Manage pricing and subscription plans</p>
              {plansQuery.isError && (
                <p className="text-sm text-destructive mt-2" role="alert">
                  {plansQuery.error instanceof Error ? plansQuery.error.message : 'Could not load plans.'}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 rounded-md border p-1">
              <Button variant={viewMode === 'cards' ? 'secondary' : 'ghost'} size="sm"
                className="h-7 px-2" onClick={() => setViewMode('cards')} aria-label="Card view">
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === 'table' ? 'secondary' : 'ghost'} size="sm"
                className="h-7 px-2" onClick={() => setViewMode('table')} aria-label="Table view">
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Subscription Analytics</CardTitle>
            <CardDescription>Active subscriptions grouped by plan name.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.map((data, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="w-20 text-sm font-medium">{data.plan}</div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded h-0.5">
                      <div className="bg-gray-800 h-0.5 rounded transition-all duration-500"
                        style={{ width: `${data.width}%` }} />
                    </div>
                  </div>
                  <div className="w-16 text-xs font-medium">{data.subscribers}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Plans grid / table */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
            {plans.map((plan) => (
              <Card key={plan.id}
                className={`relative ${plan.popular ? 'border-2 border-gray-800' : ''} ${!plan.is_active ? 'opacity-60' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gray-800 text-white px-3 py-1">
                      <Crown className="h-3 w-3 mr-1" />Most Popular
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
                    <span className="text-sm font-normal text-muted-foreground">/{plan.billing_period}</span>
                  </div>
                  <CardDescription>
                    {plan.users} subscribers · {plan.max_branches} branch{plan.max_branches !== 1 ? 'es' : ''} · {plan.max_users} staff
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {sanitiseFeatures(plan.features).map((f, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        <span className="text-sm">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <Label htmlFor={`active-${plan.id}`} className="text-sm cursor-pointer">
                        Offer to new pharmacies
                      </Label>
                      <Switch id={`active-${plan.id}`} checked={plan.is_active}
                        disabled={togglingPlanId === plan.id}
                        onCheckedChange={c => handleTogglePlanActive(plan, c)} />
                    </div>
                    <Button className="w-full" variant="outline" onClick={() => openEdit(plan)}>
                      <Edit className="h-4 w-4 mr-2" />Edit Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>All Plans</CardTitle>
              <CardDescription>{plans.length} plan{plans.length !== 1 ? 's' : ''} total</CardDescription>
            </CardHeader>
            <CardContent>
              <PlansTable plans={plans} togglingPlanId={togglingPlanId}
                onEdit={openEdit} onToggleActive={handleTogglePlanActive} pageSize={8} />
            </CardContent>
          </Card>
        )}

        {/* Plan Management toolbar */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle>Plan Management</CardTitle>
                <CardDescription>Create and manage subscription plans</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button type="button" variant="outline"
                  disabled={cleanupLoading || dedupeLoading || polarSyncLoading}
                  onClick={() => void handleCleanupFeatures()}>
                  {cleanupLoading
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cleaning…</>
                    : <><Sparkles className="h-4 w-4 mr-2" />Clean up features</>}
                </Button>
                <Button type="button" variant="outline"
                  disabled={dedupeLoading || polarSyncLoading || cleanupLoading}
                  onClick={() => void handleRemoveDuplicates()}>
                  {dedupeLoading
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cleaning…</>
                    : 'Remove duplicates'}
                </Button>
                <Button type="button" variant="outline"
                  disabled={polarSyncLoading || dedupeLoading || cleanupLoading}
                  onClick={() => void handleSyncAllToPolar()}>
                  {polarSyncLoading
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Syncing…</>
                    : 'Sync all to Polar'}
                </Button>

                {/* Create new plan dialog */}
                <Dialog open={isAddingPlan} onOpenChange={o => { setIsAddingPlan(o); if (!o) setNewForm(DEFAULT_FORM) }}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-2" />Create New Plan</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Plan</DialogTitle>
                    </DialogHeader>
                    <PlanFormFields form={newForm} onChange={p => setNewForm(prev => ({ ...prev, ...p }))} />
                    <Button className="mt-2 w-full"
                      onClick={() => void handleAddPlan()}
                      disabled={!newForm.name.trim() || !newForm.price || isAddingPlanLoading}>
                      {isAddingPlanLoading
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                        : 'Add Plan'}
                    </Button>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Edit plan dialog */}
        <Dialog open={isEditingPlan} onOpenChange={o => { setIsEditingPlan(o); if (!o) setEditingId(null) }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Plan</DialogTitle>
            </DialogHeader>
            <PlanFormFields form={editForm} onChange={p => setEditForm(prev => ({ ...prev, ...p }))} />

            {/* Active toggle (edit only) */}
            <div className="flex items-center justify-between rounded-md border px-3 py-2 mt-2">
              <Label htmlFor="edit-plan-active" className="cursor-pointer text-sm">
                Active (visible in onboarding and upgrades)
              </Label>
              <Switch id="edit-plan-active" checked={editIsActive}
                onCheckedChange={setEditIsActive} />
            </div>

            {editPolarId && (
              <p className="text-xs text-muted-foreground rounded-md border px-3 py-2">
                Polar product: <code className="text-[10px] break-all">{editPolarId}</code>
              </p>
            )}

            <Button className="mt-2 w-full" onClick={() => void handleEditPlan()} disabled={isSavingPlan}>
              {isSavingPlan
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                : 'Save Changes'}
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
