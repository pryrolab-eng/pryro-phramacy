'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Building2, Plus, MapPin, Phone, Mail, Activity,
  AlertTriangle, Loader2, RefreshCw, Lock, TrendingUp,
} from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { useSaasBranches, useCreateBranch, useSaasSubscription } from '@/hooks/useSaasSubscription'
import type { Branch, BranchUsage } from '@/lib/saas/types'
import { FeatureGate } from '@/components/feature-gate'

type BranchWithUsage = Branch & { usage: BranchUsage | null }

// ─── Helpers ──────────────────────────────────────────────

function usagePct(usage: BranchUsage | null): number {
  if (!usage || usage.tx_limit === 0) return 0
  return Math.min(100, Math.round((usage.tx_count / usage.tx_limit) * 100))
}

function usageColor(pct: number, blocked: boolean): string {
  if (blocked) return 'bg-red-500'
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 70) return 'bg-amber-500'
  return 'bg-green-500'
}

// ─── Page ─────────────────────────────────────────────────

export default function BranchesPage() {
  const branchesQuery = useSaasBranches()
  const subQuery = useSaasSubscription()
  const createBranch = useCreateBranch()

  const [addOpen, setAddOpen] = useState(false)
  const [limitWarningOpen, setLimitWarningOpen] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', phone: '', email: '' })
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const branches: BranchWithUsage[] = branchesQuery.data ?? []
  const summary = subQuery.data
  const canAddBranch = summary?.can_add_branch ?? false
  const branchCount = summary?.branch_count ?? 0
  const branchLimit = summary?.branch_limit ?? 0

  const handleAddBranch = async () => {
    if (!form.name.trim()) {
      showToast('Branch name is required', 'error')
      return
    }
    try {
      await createBranch.mutateAsync({
        name: form.name.trim(),
        address: form.address || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
      })
      setAddOpen(false)
      setForm({ name: '', address: '', phone: '', email: '' })
      showToast('Branch created successfully')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create branch', 'error')
    }
  }

  const handleAddClick = () => {
    if (!canAddBranch) {
      setLimitWarningOpen(true)
      return
    }
    setAddOpen(true)
  }

  if (branchesQuery.isPending || subQuery.isPending) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <FeatureGate feature="multi_branch">
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Branch Management</h1>
          <p className="text-muted-foreground">Manage your pharmacy locations and monitor usage</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { void branchesQuery.refetch(); void subQuery.refetch() }}
            disabled={branchesQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${branchesQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleAddClick} disabled={!canAddBranch}>
            {!canAddBranch ? <Lock className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            Add Branch
          </Button>
        </div>
      </div>

      {/* Plan usage banner */}
      <Card className={branchCount >= branchLimit && branchLimit > 0 ? 'border-amber-300 bg-amber-50' : ''}>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {branchCount} of {branchLimit} branches used
                  {summary?.main_subscription?.plan?.name
                    ? ` · ${summary.main_subscription.plan.name} plan`
                    : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  {canAddBranch
                    ? `${branchLimit - branchCount} slot${branchLimit - branchCount !== 1 ? 's' : ''} remaining`
                    : 'Limit reached — upgrade your plan or add a Branch Add-on'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 min-w-[160px]">
              <Progress
                value={branchLimit > 0 ? Math.min(100, (branchCount / branchLimit) * 100) : 0}
                className="flex-1 h-2"
              />
              <span className="text-xs font-medium whitespace-nowrap">
                {branchCount}/{branchLimit}
              </span>
            </div>
            {!canAddBranch && branchLimit > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="border-amber-400 text-amber-700 hover:bg-amber-100"
                onClick={() => window.location.href = '/pharmacy-dashboard/billing'}
              >
                Upgrade Plan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* No subscription warning */}
      {!summary?.main_subscription && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">No active subscription</p>
              <p className="text-xs text-red-700">
                You need an active plan to create branches and process transactions.{' '}
                <a href="/pharmacy-dashboard/billing" className="underline font-medium">Subscribe now →</a>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Branch cards */}
      {branches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Building2 className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-semibold text-lg">No branches yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                Add your first branch to start tracking usage
              </p>
            </div>
            <Button onClick={handleAddClick} disabled={!canAddBranch}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Branch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map(branch => (
            <BranchCard key={branch.id} branch={branch} />
          ))}
        </div>
      )}

      {/* Add branch dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Branch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Branch Name *</Label>
              <Input
                placeholder="e.g. Remera Branch"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                placeholder="Full address"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  placeholder="+250788123456"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  placeholder="branch@pharmacy.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => void handleAddBranch()}
                disabled={createBranch.isPending || !form.name.trim()}
                className="flex-1"
              >
                {createBranch.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Create Branch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Limit warning dialog */}
      <AlertDialog open={limitWarningOpen} onOpenChange={setLimitWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Branch Limit Reached
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your current plan allows {branchLimit} branch{branchLimit !== 1 ? 'es' : ''}.
              You have used all {branchLimit} slot{branchLimit !== 1 ? 's' : ''}.
              Upgrade your plan or add a Branch Add-on to create more branches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setLimitWarningOpen(false); window.location.href = '/pharmacy-dashboard/billing' }}>
              View Plans
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </FeatureGate>
  )
}

// ─── Branch card ───────────────────────────────────────────

function BranchCard({ branch }: { branch: BranchWithUsage }) {
  const usage = branch.usage
  const pct = usagePct(usage)
  const color = usageColor(pct, usage?.is_blocked ?? false)

  return (
    <Card className={usage?.is_blocked ? 'border-red-300' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {branch.name}
          </div>
          <div className="flex gap-1">
            {usage?.is_blocked && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Blocked
              </Badge>
            )}
            <Badge variant={branch.is_active ? 'default' : 'secondary'}>
              {branch.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Contact info */}
        <div className="space-y-1.5 text-sm">
          {branch.address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{branch.address}</span>
            </div>
          )}
          {branch.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {branch.phone}
            </div>
          )}
          {branch.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{branch.email}</span>
            </div>
          )}
        </div>

        {/* Usage widget */}
        {usage ? (
          <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-medium">
                <Activity className="h-3.5 w-3.5" />
                Transactions this month
              </span>
              <span className="font-bold">
                {usage.tx_count.toLocaleString()} / {usage.tx_limit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{pct}% used</span>
              <span>Resets {new Date(usage.billing_cycle_end).toLocaleDateString()}</span>
            </div>
            {usage.is_blocked && (
              <p className="text-xs text-red-600 font-medium">
                Transaction limit reached. New sales are blocked until the cycle resets or plan is upgraded.
              </p>
            )}
            {!usage.is_blocked && pct >= 80 && (
              <p className="text-xs text-amber-600 font-medium">
                Approaching limit — {usage.tx_limit - usage.tx_count} transactions remaining.
              </p>
            )}
          </div>
        ) : (
          <div className="border rounded-lg p-3 bg-muted/30 text-xs text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            No usage record for this billing cycle
          </div>
        )}
      </CardContent>
    </Card>
  )
}
