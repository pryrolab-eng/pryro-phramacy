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

  const plans = plansQuery.data ?? []
  const allSubs = subsQuery.data ?? []

  const handleRemoveDuplicates = async () => {
    setDedupeLoading(true)
    try {
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
