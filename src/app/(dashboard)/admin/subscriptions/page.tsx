'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
  GitBranch, Users, ArrowUpDown, Activity,
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
  price: '',
  billing_period: 'monthly',
  plan_type: 'main',
  max_branches: '1',
  max_users: '5',
  monthly_tx_limit: '500',
  features: '',
  is_popular: false,
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
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const plans = plansQuery.data ?? []
  const allSubs = subsQuery.data ?? []

  // Stats
  const activeSubs = allSubs.filter((s: { status: string }) => s.status === 'active').length
  const totalRevenue = allSubs
    .filter((s: { status: string }) => s.status === 'active')
    .reduce((sum: number, s: { plan?: { price?: number } }) => sum + Number(s.plan?.price ?? 0), 0)

  const handleCreate = async () => {
    try {
      await createPlan.mutateAsync({
        name: form.name,
        price: Number(form.price),
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
    setEditForm({
      name: plan.name,
      price: String(plan.price),
      billing_period: plan.billing_period,
      plan_type: plan.plan_type,
      max_branches: String(plan.max_branches),
      max_users: String(plan.max_users),
      monthly_tx_limit: String(plan.monthly_tx_limit),
      features: plan.features.join(', '),
      is_popular: plan.is_popular,
    })
    setEditOpen(true)
  }

  const handleEdit = async () => {
    if (!editTarget) return
    try {
      await updatePlan.mutateAsync({
        planId: editTarget.id,
        updates: {
          name: editForm.name,
          price: Number(editForm.price),
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
    if (!next) {
      setDeactivateTarget(plan)
      return
    }
    try {
      await updatePlan.mutateAsync({ planId: plan.id, updates: { is_active: true } })
      void qc.invalidateQueries({ queryKey: saasKeys.plans })
      showToast(`${plan.name} activated`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error')
    }
  }

  const confirmDeactivate = async () => {
    if (!deactivateTarget) return
    try {
      await updatePlan.mutateAsync({ planId: deactivateTarget.id, updates: { is_active: false } })
      void qc.invalidateQueries({ queryKey: saasKeys.plans })
      showToast(`${deactivateTarget.name} deactivated`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed', 'error')
    } finally {
      setDeactivateTarget(null)
    }
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
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8 text-blue-600" />
            Subscription Plans
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage SaaS plans — branch limits, user limits, transaction limits
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Subscription Plan</DialogTitle>
            </DialogHeader>
            <PlanForm form={form} setForm={setForm} />
            <Button
              onClick={() => void handleCreate()}
              disabled={createPlan.isPending || !form.name || !form.price}
              className="w-full mt-2"
            >
              {createPlan.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Create Plan
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<CreditCard className="h-5 w-5 text-blue-500" />} label="Total Plans" value={plans.length} />
        <StatCard icon={<Activity className="h-5 w-5 text-green-500" />} label="Active Subscriptions" value={activeSubs} />
        <StatCard icon={<ArrowUpDown className="h-5 w-5 text-purple-500" />} label="Monthly Revenue" value={`RWF ${totalRevenue.toLocaleString()}`} />
        <StatCard icon={<GitBranch className="h-5 w-5 text-orange-500" />} label="Active Plans" value={plans.filter(p => p.is_active).length} />
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {plans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onEdit={() => openEdit(plan)}
            onToggle={(next) => void handleToggleActive(plan, next)}
          />
        ))}
      </div>

      {/* All subscriptions table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>Every active subscription across all pharmacies</CardDescription>
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
                    <th className="pb-2">Period End</th>
                  </tr>
                </thead>
                <tbody>
                  {allSubs.map((s: {
                    id: string
                    pharmacy?: { name?: string }
                    plan?: { name?: string; price?: number }
                    subscription_type: string
                    status: string
                    current_period_end?: string
                  }) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 pr-4 font-medium">{s.pharmacy?.name ?? '—'}</td>
                      <td className="py-2 pr-4">{s.plan?.name ?? '—'}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={s.subscription_type === 'main' ? 'default' : 'secondary'}>
                          {s.subscription_type}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="py-2 pr-4">RWF {Number(s.plan?.price ?? 0).toLocaleString()}</td>
                      <td className="py-2 text-muted-foreground">
                        {s.current_period_end
                          ? new Date(s.current_period_end).toLocaleDateString()
                          : '—'}
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
          <DialogHeader>
            <DialogTitle>Edit Plan — {editTarget?.name}</DialogTitle>
          </DialogHeader>
          <PlanForm form={editForm} setForm={setEditForm} />
          <Button
            onClick={() => void handleEdit()}
            disabled={updatePlan.isPending}
            className="w-full mt-2"
          >
            {updatePlan.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirm */}
      <AlertDialog open={!!deactivateTarget} onOpenChange={(o) => !o && setDeactivateTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {deactivateTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This plan will be hidden from new signups. Existing subscriptions are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDeactivate()}>Deactivate</AlertDialogAction>
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

function PlanCard({
  plan,
  onEdit,
  onToggle,
}: {
  plan: SubscriptionPlan
  onEdit: () => void
  onToggle: (next: boolean) => void
}) {
  return (
    <Card className={`relative ${plan.is_popular ? 'border-2 border-blue-600' : ''} ${!plan.is_active ? 'opacity-60' : ''}`}>
      {plan.is_popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-3">
            <Crown className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{plan.name}</CardTitle>
          <Badge variant={plan.plan_type === 'main' ? 'default' : 'secondary'}>
            {plan.plan_type === 'main' ? 'Main Plan' : 'Branch Add-on'}
          </Badge>
        </div>
        <div className="text-3xl font-bold">
          {plan.price === 0 ? 'Free' : `RWF ${Number(plan.price).toLocaleString()}`}
          {plan.price > 0 && (
            <span className="text-sm font-normal text-muted-foreground">/{plan.billing_period}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Limits */}
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

        {/* Features */}
        <ul className="space-y-1">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* Controls */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Switch
              checked={plan.is_active}
              onCheckedChange={onToggle}
              id={`active-${plan.id}`}
            />
            <Label htmlFor={`active-${plan.id}`} className="text-xs cursor-pointer">
              {plan.is_active ? 'Active' : 'Inactive'}
            </Label>
          </div>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PlanForm({
  form,
  setForm,
}: {
  form: typeof emptyForm
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>
}) {
  const set = (key: keyof typeof emptyForm, val: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Plan Name</Label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Standard" />
        </div>
        <div className="space-y-1">
          <Label>Price (RWF)</Label>
          <Input type="number" min={0} value={form.price} onChange={e => set('price', e.target.value)} placeholder="0" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
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
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Max Branches</Label>
          <Input type="number" min={1} value={form.max_branches} onChange={e => set('max_branches', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Max Users</Label>
          <Input type="number" min={1} value={form.max_users} onChange={e => set('max_users', e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Tx Limit/mo</Label>
          <Input type="number" min={1} value={form.monthly_tx_limit} onChange={e => set('monthly_tx_limit', e.target.value)} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Features (comma-separated)</Label>
        <Textarea
          value={form.features}
          onChange={e => set('features', e.target.value)}
          placeholder="Full POS, Insurance billing, Advanced reports"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={form.is_popular}
          onCheckedChange={v => set('is_popular', v)}
          id="is-popular"
        />
        <Label htmlFor="is-popular" className="cursor-pointer">Mark as Most Popular</Label>
      </div>
    </div>
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
