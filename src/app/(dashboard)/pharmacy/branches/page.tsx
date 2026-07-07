'use client'

import { PHARMACY_ROUTES } from '@/lib/routes/pharmacy-paths'

import { useMemo, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Building2,
  RefreshCw,
  Lock,
  CreditCard,
  Plus,
  Activity,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardPageLoading,
  DashboardToolbar,
  DashboardButton,
  DashboardMetricGrid,
  DashboardStatCard,
  DashboardTableCard,
  DashboardSearchInput,
  DashboardPanelEmpty,
  AlertDialog,
  DashboardAlertDialogContent,
  DashboardAlertDialogHeader,
  DashboardAlertDialogTitle,
  DashboardAlertDialogDescription,
  DashboardAlertDialogActions,
} from '@/components/dashboard'
import { BranchListRow } from '@/components/branches/branch-list-row'
import { BranchDetailSheet } from '@/components/branches/branch-detail-sheet'
import { BranchSlotsBanner } from '@/components/branches/branch-slots-banner'
import { BranchAddDialog } from '@/components/branches/branch-add-dialog'
import { BranchAddonCheckoutDialog } from '@/components/subscription/branch-addon-checkout-dialog'
import { FeatureGate } from '@/components/subscription/feature-gate'
import { useSaasBranches, useCreateBranch, useSaasSubscription, useSaasPlans } from '@/hooks/useSaasSubscription'
import { useLocalListSearch } from '@/hooks/useLocalListSearch'
import { filterBranchesForSearch } from '@/lib/branches/search-branches'
import type { SaasBranchWithUsage } from '@/lib/http/saas-branches'
import { branchStats } from '@/lib/branches/branch-usage'
import type { CreateSaasBranchInput } from '@/lib/http/saas-branches'

export default function BranchesPage() {
  const branchesQuery = useSaasBranches()
  const subQuery = useSaasSubscription()
  const plansQuery = useSaasPlans()
  const createBranch = useCreateBranch()

  const [searchTerm, setSearchTerm] = useState('')
  const filterBranches = useCallback(
    (rows: SaasBranchWithUsage[], q: string) =>
      filterBranchesForSearch(rows, q),
    [],
  )
  const { filtered } = useLocalListSearch(
    searchTerm,
    branchesQuery.data,
    filterBranches,
  )
  const [addOpen, setAddOpen] = useState(false)
  const [addonCheckoutOpen, setAddonCheckoutOpen] = useState(false)
  const [limitWarningOpen, setLimitWarningOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<SaasBranchWithUsage | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const branches: SaasBranchWithUsage[] = branchesQuery.data ?? []
  const summary = subQuery.data
  const stats = useMemo(() => branchStats(branches), [branches])

  const canAddBranch = summary?.can_add_branch ?? false
  const branchCount = summary?.branch_count ?? 0
  const branchLimit = summary?.branch_limit ?? 0
  const mainSlots = summary?.main_plan_branch_slots ?? branchLimit
  const addonCount = summary?.addon_subscription_count ?? 0
  const needsAddonForNewBranch =
    branchCount >= mainSlots && branchCount >= branchLimit
  const addonPlans = (plansQuery.data ?? []).filter(
    (p) => p.plan_type === 'branch_addon' && p.is_active,
  )

  const overPlanCount = branches.filter((b) => b.over_plan_limit).length

  const handleAddBranch = async (input: CreateSaasBranchInput) => {
    if (!input.name.trim()) {
      toast.error('Branch name is required')
      throw new Error('Branch name is required')
    }
    await createBranch.mutateAsync({
      name: input.name.trim(),
      address: input.address || undefined,
      phone: input.phone || undefined,
      email: input.email || undefined,
    })
    toast.success('Branch created')
  }

  const handleAddClick = () => {
    if (!summary?.main_subscription) {
      toast.error('Subscribe to a main plan first')
      return
    }
    if (needsAddonForNewBranch) {
      if (addonPlans.length === 0) {
        toast.error('No branch add-on plans available. Contact support.')
        return
      }
      setAddonCheckoutOpen(true)
      return
    }
    if (!canAddBranch) {
      setLimitWarningOpen(true)
      return
    }
    setAddOpen(true)
  }

  const addButtonLabel = needsAddonForNewBranch
    ? 'Add branch (add-on)'
    : !canAddBranch
      ? 'Limit reached'
      : 'Add branch'

  if (branchesQuery.isPending || subQuery.isPending) {
    return <DashboardPageLoading label="Loading branches…" />
  }

  return (
    <FeatureGate featureKey="branches.access">
      <DashboardPageShell>
        <DashboardPageHeader
          title="Branches"
          description="Manage locations and monitor per-branch transaction usage"
          actions={
            <DashboardToolbar>
              <DashboardButton
                onClick={() => {
                  void branchesQuery.refetch()
                  void subQuery.refetch()
                }}
                disabled={branchesQuery.isFetching}
              >
                <RefreshCw
                  className={`mr-1.5 h-4 w-4 ${branchesQuery.isFetching ? 'animate-spin' : ''}`}
                />
                Refresh
              </DashboardButton>
              <DashboardButton
                tone="primary"
                onClick={handleAddClick}
              >
                {needsAddonForNewBranch ? (
                  <CreditCard className="mr-1.5 h-4 w-4" />
                ) : !canAddBranch ? (
                  <Lock className="mr-1.5 h-4 w-4" />
                ) : (
                  <Plus className="mr-1.5 h-4 w-4" />
                )}
                {addButtonLabel}
              </DashboardButton>
            </DashboardToolbar>
          }
        />

        {overPlanCount > 0 ? (
          <div className="rounded-lg border border-amber-300/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            <p className="font-medium">
              {overPlanCount} extra branch{overPlanCount !== 1 ? "es" : ""} from an
              earlier bug
            </p>
            <p className="mt-1 text-xs text-amber-900/90 dark:text-amber-200/90">
              Your plan includes {branchLimit} slot{branchLimit !== 1 ? "s" : ""}, but{" "}
              {branchCount} active locations exist in the database. Rows marked{" "}
              <span className="font-medium">Extra — not on plan</span> should be removed
              (run <code className="text-[11px]">scripts/cleanup-duplicate-branches.sql</code>{" "}
              in Supabase SQL, then refresh).
            </p>
          </div>
        ) : null}

        <BranchSlotsBanner
          summary={summary}
          branchCount={branchCount}
          branchLimit={branchLimit}
          mainSlots={mainSlots}
          addonCount={addonCount}
          canAddBranch={canAddBranch}
          needsAddonForNewBranch={needsAddonForNewBranch}
          hasAddonPlans={addonPlans.length > 0}
          onBuyAddon={() => setAddonCheckoutOpen(true)}
        />

        <DashboardMetricGrid>
          <DashboardStatCard
            label="Locations"
            icon={Building2}
            value={stats.total}
            hint="Branches on your account"
          />
          <DashboardStatCard
            label="Active"
            icon={CheckCircle}
            value={stats.active}
            hint="Available for operations"
          />
          <DashboardStatCard
            label="Near limit"
            icon={Activity}
            value={stats.nearLimit}
            hint="≥80% of monthly transactions"
          />
          <DashboardStatCard
            label="Blocked"
            icon={AlertTriangle}
            value={stats.blocked}
            hint="Sales blocked until reset or upgrade"
          />
        </DashboardMetricGrid>

        <DashboardTableCard
          title="Branch directory"
          description={`${filtered.length} of ${branches.length} shown`}
          toolbar={
            <DashboardSearchInput
              placeholder="Search name, address, phone…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm flex-1"
            />
          }
        >
          {filtered.length === 0 ? (
            <div className="p-6">
              <DashboardPanelEmpty
                icon={Building2}
                title={branches.length === 0 ? 'No branches yet' : 'No matches'}
                description={
                  branches.length === 0
                    ? 'Add your first location to track usage and run POS per branch.'
                    : 'Try a different search term.'
                }
              />
              {branches.length === 0 && (
                <div className="mt-4 flex justify-center">
                  <DashboardButton tone="primary" onClick={handleAddClick}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    Add first branch
                  </DashboardButton>
                </div>
              )}
            </div>
          ) : (
            <ul className="space-y-2 p-4">
              {filtered.map((branch) => (
                <li key={branch.id}>
                  <BranchListRow
                    branch={branch}
                    onSelect={(b) => {
                      setSelectedBranch(b)
                      setSheetOpen(true)
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </DashboardTableCard>

        <BranchAddDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          onSubmit={handleAddBranch}
          isPending={createBranch.isPending}
        />

        <BranchDetailSheet
          branch={selectedBranch}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />

        <AlertDialog open={limitWarningOpen} onOpenChange={setLimitWarningOpen}>
          <DashboardAlertDialogContent>
            <DashboardAlertDialogHeader>
              <DashboardAlertDialogTitle>Branch limit reached</DashboardAlertDialogTitle>
              <DashboardAlertDialogDescription>
                You are using all {branchLimit} slot{branchLimit !== 1 ? 's' : ''} (
                {mainSlots} on your main plan
                {addonCount > 0 ? ` plus ${addonCount} add-on` : ''}). Purchase another
                branch add-on or upgrade your main plan.
              </DashboardAlertDialogDescription>
            </DashboardAlertDialogHeader>
            <DashboardAlertDialogActions
              cancelLabel="Close"
              confirmLabel={
                addonPlans.length > 0 ? 'Buy branch add-on' : 'View billing'
              }
              onCancel={() => setLimitWarningOpen(false)}
              onConfirm={() => {
                setLimitWarningOpen(false)
                if (addonPlans.length > 0) {
                  setAddonCheckoutOpen(true)
                } else {
                  window.location.href = PHARMACY_ROUTES.billing
                }
              }}
            />
          </DashboardAlertDialogContent>
        </AlertDialog>

        <BranchAddonCheckoutDialog
          open={addonCheckoutOpen}
          onOpenChange={setAddonCheckoutOpen}
          addonPlans={addonPlans}
          mode="new_branch"
          onSuccess={() => {
            void branchesQuery.refetch()
            void subQuery.refetch()
            toast.success('Branch add-on activated')
          }}
        />
      </DashboardPageShell>
    </FeatureGate>
  )
}
