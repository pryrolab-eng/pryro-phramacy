'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  useCreateCustomerMutation,
  useCustomers,
  type CustomerRow,
} from '@/hooks/useCustomers'
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
} from '@/components/dashboard'
import { CustomerListRow } from '@/components/customers/customer-list-row'
import { CustomerDetailSheet } from '@/components/customers/customer-detail-sheet'
import {
  CustomersAddDialog,
  CustomersAddDialogTrigger,
} from '@/components/customers/customers-add-dialog'
import { Users, UserCheck, Shield, CalendarDays, RefreshCw } from 'lucide-react'
import { FeatureGate } from '@/components/subscription/feature-gate'

function customerStats(customers: CustomerRow[]) {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const withInsurance = customers.filter(
    (c) => (c.insurance || c.insurance_number || '').trim().length > 0,
  ).length

  const newThisMonth = customers.filter((c) => {
    if (!c.lastVisit) return false
    const d = new Date(c.lastVisit)
    return !Number.isNaN(d.getTime()) && d >= monthStart
  }).length

  return {
    total: customers.length,
    active: customers.filter((c) => c.status !== 'inactive').length,
    withInsurance,
    newThisMonth,
  }
}

export default function CustomersPage() {
  const customersQuery = useCustomers()
  const createCustomerMutation = useCreateCustomerMutation()
  const customers = customersQuery.data ?? []
  const [searchTerm, setSearchTerm] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const stats = useMemo(() => customerStats(customers), [customers])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q) ||
        (c.insurance ?? '').toLowerCase().includes(q) ||
        (c.insurance_number ?? '').toLowerCase().includes(q),
    )
  }, [customers, searchTerm])

  const handleAddCustomer = async (
    input: Parameters<typeof createCustomerMutation.mutateAsync>[0],
  ) => {
    try {
      const result = await createCustomerMutation.mutateAsync(input)
      if (result.success) {
        toast.success('Customer added', {
          description: result.customer?.name ?? input.name,
        })
      } else {
        toast.error('Could not add customer', {
          description: result.error ?? 'Unknown error',
        })
      }
    } catch (e) {
      toast.error('Could not add customer', {
        description: e instanceof Error ? e.message : 'Unknown error',
      })
    }
  }

  if (customersQuery.isPending) {
    return <DashboardPageLoading label="Loading customers…" />
  }

  return (
    <FeatureGate featureKey="customers.access">
      <DashboardPageShell>
        <DashboardPageHeader
          title="Customers"
          description="Manage customer profiles for POS, insurance, and visit history"
          actions={
            <DashboardToolbar>
              <DashboardButton
                onClick={() => void customersQuery.refetch()}
                disabled={customersQuery.isFetching}
              >
                <RefreshCw
                  className={`mr-1.5 h-4 w-4 ${customersQuery.isFetching ? 'animate-spin' : ''}`}
                />
                Refresh
              </DashboardButton>
              <CustomersAddDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                onSubmit={handleAddCustomer}
                isPending={createCustomerMutation.isPending}
                trigger={<CustomersAddDialogTrigger />}
              />
            </DashboardToolbar>
          }
        />

        <DashboardMetricGrid>
          <DashboardStatCard
            label="Total customers"
            icon={Users}
            value={stats.total}
            hint="Registered in your pharmacy"
          />
          <DashboardStatCard
            label="Active"
            icon={UserCheck}
            value={stats.active}
            hint="Available for sales"
          />
          <DashboardStatCard
            label="With insurance"
            icon={Shield}
            value={stats.withInsurance}
            hint="Insurance number on file"
          />
          <DashboardStatCard
            label="New this month"
            icon={CalendarDays}
            value={stats.newThisMonth}
            hint="Added since month start"
          />
        </DashboardMetricGrid>

        <DashboardTableCard
          title="Customer directory"
          description={`${filtered.length} of ${customers.length} shown`}
          toolbar={
            <DashboardSearchInput
              placeholder="Search name, phone, email, insurance…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm flex-1"
            />
          }
        >
          {filtered.length === 0 ? (
            <div className="p-6">
              <DashboardPanelEmpty
                icon={Users}
                title={customers.length === 0 ? 'No customers yet' : 'No matches'}
                description={
                  customers.length === 0
                    ? 'Add your first customer to speed up checkout and track visits.'
                    : 'Try a different search term.'
                }
                actionLabel={customers.length === 0 ? 'Add customer' : undefined}
                actionHref={undefined}
              />
              {customers.length === 0 && (
                <div className="mt-4 flex justify-center">
                  <DashboardButton tone="primary" onClick={() => setAddOpen(true)}>
                    Add customer
                  </DashboardButton>
                </div>
              )}
            </div>
          ) : (
            <ul className="space-y-2 p-4">
              {filtered.map((customer) => (
                <li key={customer.id}>
                  <CustomerListRow
                    customer={customer}
                    onSelect={(c) => {
                      setSelectedId(c.id)
                      setSheetOpen(true)
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </DashboardTableCard>

        <CustomerDetailSheet
          customerId={selectedId}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onDeleted={() => setSelectedId(null)}
        />
      </DashboardPageShell>
    </FeatureGate>
  )
}
