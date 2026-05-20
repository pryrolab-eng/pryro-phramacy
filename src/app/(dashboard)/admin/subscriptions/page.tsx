'use client'

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

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
import { createAdminPlan, syncAllPlansToPolar, updateAdminPlan, type AdminSubscriptionPlanRow } from '@/lib/http/admin/plans'
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
      } else if (polarSync?.action === 'created' || polarSync?.action === 'updated') {
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
      } else if (data.polarSync?.action === 'created' || data.polarSync?.action === 'updated') {
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
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={polarSyncLoading}
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
}
