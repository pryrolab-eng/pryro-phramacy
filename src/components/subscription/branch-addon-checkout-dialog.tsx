'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CreditCard, GitBranch, Loader2 } from 'lucide-react'
import type { SubscriptionPlan } from '@/lib/saas/types'
import {
  createPendingBranchAddon,
  startPolarSubscriptionCheckout,
} from '@/lib/subscription/checkout-client'
import {
  INVALID_EMAIL_MESSAGE,
  isValidEmail,
  normalizeEmail,
} from '@/lib/validation/email'

export type BranchAddonCheckoutMode = 'new_branch' | 'existing_branch'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  addonPlans: SubscriptionPlan[]
  mode: BranchAddonCheckoutMode
  /** Required when mode is existing_branch */
  branchId?: string
  branchName?: string
  /** Pre-selected add-on plan */
  initialPlanId?: string
  customerName?: string
  customerEmail?: string
  onSuccess?: () => void
}

export function BranchAddonCheckoutDialog({
  open,
  onOpenChange,
  addonPlans,
  mode,
  branchId: existingBranchId,
  branchName: existingBranchName,
  initialPlanId,
  customerName = 'Pharmacy customer',
  customerEmail = '',
  onSuccess,
}: Props) {
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId ?? '')
  const [branchForm, setBranchForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  })
  const [email, setEmail] = useState(customerEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialPlanId) setSelectedPlanId(initialPlanId)
  }, [initialPlanId])

  useEffect(() => {
    if (open) {
      setError(null)
      setEmail(customerEmail)
    }
  }, [open, customerEmail])

  const selectedPlan = addonPlans.find((p) => p.id === selectedPlanId)

  const handlePay = async () => {
    if (!selectedPlan) {
      setError('Select a branch add-on plan')
      return
    }
    if (mode === 'new_branch' && !branchForm.name.trim()) {
      setError('Branch name is required')
      return
    }
    const normalizedEmail = normalizeEmail(email)
    if (!normalizedEmail) {
      setError('Email is required for payment')
      return
    }
    if (!isValidEmail(normalizedEmail)) {
      setError(INVALID_EMAIL_MESSAGE)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const subscription = await createPendingBranchAddon({
        planId: selectedPlan.id,
        branchId: mode === 'existing_branch' ? existingBranchId : undefined,
        branch:
          mode === 'new_branch'
            ? {
                name: branchForm.name.trim(),
                address: branchForm.address || undefined,
                phone: branchForm.phone || undefined,
                email: branchForm.email || undefined,
              }
            : undefined,
      })

      const polar = await startPolarSubscriptionCheckout({
        planId: selectedPlan.id,
        subscriptionId: subscription.id,
        customerEmail: normalizedEmail,
        customerName,
        returnContext: 'settings',
      })
      window.location.href = polar.checkoutUrl
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed')
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-blue-600" />
            Branch add-on checkout
          </DialogTitle>
          <DialogDescription>
            {mode === 'new_branch'
              ? 'Create an extra branch location and pay for a dedicated branch add-on subscription.'
              : `Add a subscription for branch “${existingBranchName ?? 'selected'}”.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Add-on plan</Label>
            <Select
              value={selectedPlanId}
              onValueChange={setSelectedPlanId}
              disabled={loading || addonPlans.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select add-on plan" />
              </SelectTrigger>
              <SelectContent>
                {addonPlans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — RWF {Number(p.price).toLocaleString()}/
                    {p.billing_period}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {addonPlans.length === 0 && (
              <p className="text-xs text-amber-600">
                No branch add-on plans are configured. Ask your administrator to create
                plans with type “branch_addon”.
              </p>
            )}
          </div>

          {mode === 'new_branch' && (
            <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
              <p className="text-sm font-medium">New branch details</p>
              <div>
                <Label>Branch name *</Label>
                <Input
                  value={branchForm.name}
                  onChange={(e) =>
                    setBranchForm({ ...branchForm, name: e.target.value })
                  }
                  placeholder="e.g. Remera Branch"
                  disabled={loading}
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={branchForm.address}
                  onChange={(e) =>
                    setBranchForm({ ...branchForm, address: e.target.value })
                  }
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={branchForm.phone}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, phone: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={branchForm.email}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, email: e.target.value })
                    }
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedPlan && (
            <div className="p-3 rounded-lg border bg-blue-50/80 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Monthly transactions / branch</span>
                <Badge variant="secondary">
                  {selectedPlan.monthly_tx_limit.toLocaleString()} tx
                </Badge>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="font-medium">Total due now</span>
                <span className="text-xl font-bold text-blue-700">
                  RWF {Number(selectedPlan.price).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div>
            <Label>Email</Label>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => void handlePay()}
              disabled={loading || !selectedPlan || addonPlans.length === 0}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Pay & activate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
