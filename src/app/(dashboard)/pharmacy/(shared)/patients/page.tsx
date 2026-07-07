'use client'

import { useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  useCreateCustomerMutation,
  useCustomers,
  type CustomerRow,
} from '@/hooks/useCustomers'
import { useLocalListSearch } from '@/hooks/useLocalListSearch'
import { filterCustomerListRows } from '@/lib/customers/search-customers'
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
import {
  CustomersAddDialog,
  CustomersAddDialogTrigger,
} from '@/components/customers/customers-add-dialog'
import { CustomerDetailSheet } from '@/components/customers/customer-detail-sheet'
import { PatientListRow } from '@/components/patients/patient-list-row'
import { FeatureGate } from '@/components/subscription/feature-gate'
import { PHARMACY_ROUTES } from '@/lib/routes/pharmacy-paths'
import {
  CalendarDays,
  ClipboardList,
  HeartPulse,
  RefreshCw,
  Stethoscope,
  UserCheck,
} from 'lucide-react'

function patientStats(patients: CustomerRow[]) {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const withAllergies = patients.filter(
    (p) => (p.allergies ?? '').trim().length > 0,
  ).length

  const visitedThisMonth = patients.filter((p) => {
    if (!p.lastVisit) return false
    const d = new Date(p.lastVisit)
    return !Number.isNaN(d.getTime()) && d >= monthStart
  }).length

  return {
    total: patients.length,
    active: patients.filter((p) => p.status !== 'inactive').length,
    withAllergies,
    visitedThisMonth,
  }
}

export default function PatientsPage() {
  const patientsQuery = useCustomers()
  const createPatientMutation = useCreateCustomerMutation()
  const [searchTerm, setSearchTerm] = useState('')
  const filterPatients = useCallback(
    (rows: CustomerRow[], q: string) => filterCustomerListRows(rows, q),
    [],
  )
  const { filtered } = useLocalListSearch(
    searchTerm,
    patientsQuery.data,
    filterPatients,
  )
  const patients = patientsQuery.data ?? []
  const [addOpen, setAddOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const stats = useMemo(() => patientStats(patients), [patients])

  const handleAddPatient = async (
    input: Parameters<typeof createPatientMutation.mutateAsync>[0],
  ) => {
    try {
      const result = await createPatientMutation.mutateAsync(input)
      if (result.success) {
        toast.success('Patient added', {
          description: result.customer?.name ?? input.name,
        })
      } else {
        toast.error('Could not add patient', {
          description: result.error ?? 'Unknown error',
        })
      }
    } catch (e) {
      toast.error('Could not add patient', {
        description: e instanceof Error ? e.message : 'Unknown error',
      })
    }
  }

  if (patientsQuery.isPending) {
    return <DashboardPageLoading label="Loading patients…" />
  }

  return (
    <FeatureGate featureKey="patients.access">
      <DashboardPageShell>
        <DashboardPageHeader
          title="Patients"
          description="Patient profiles, allergies, and visit history for dispensing and care"
          actions={
            <DashboardToolbar>
              <DashboardButton
                onClick={() => void patientsQuery.refetch()}
                disabled={patientsQuery.isFetching}
              >
                <RefreshCw
                  className={`mr-1.5 h-4 w-4 ${patientsQuery.isFetching ? 'animate-spin' : ''}`}
                />
                Refresh
              </DashboardButton>
              <DashboardButton asChild>
                <Link href={PHARMACY_ROUTES.prescriptions}>
                  <ClipboardList className="mr-1.5 h-4 w-4" />
                  Prescriptions
                </Link>
              </DashboardButton>
              <CustomersAddDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                onSubmit={handleAddPatient}
                isPending={createPatientMutation.isPending}
                title="Add patient"
                description="Register a patient for prescriptions, POS lookup, and visit tracking."
                confirmLabel="Add patient"
                trigger={
                  <CustomersAddDialogTrigger label="Add patient" />
                }
              />
            </DashboardToolbar>
          }
        />

        <DashboardMetricGrid>
          <DashboardStatCard
            label="Total patients"
            icon={HeartPulse}
            value={stats.total}
            hint="Registered patient records"
          />
          <DashboardStatCard
            label="Active"
            icon={UserCheck}
            value={stats.active}
            hint="Available for dispensing"
          />
          <DashboardStatCard
            label="Allergies on file"
            icon={Stethoscope}
            value={stats.withAllergies}
            hint="Safety notes documented"
          />
          <DashboardStatCard
            label="Visits this month"
            icon={CalendarDays}
            value={stats.visitedThisMonth}
            hint="Based on last visit date"
          />
        </DashboardMetricGrid>

        <DashboardTableCard
          title="Patient directory"
          description={`${filtered.length} of ${patients.length} shown`}
          toolbar={
            <DashboardSearchInput
              placeholder="Search name, phone, email, allergies…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm flex-1"
            />
          }
        >
          {filtered.length === 0 ? (
            <div className="p-6">
              <DashboardPanelEmpty
                icon={HeartPulse}
                title={patients.length === 0 ? 'No patients yet' : 'No matches'}
                description={
                  patients.length === 0
                    ? 'Add patients at checkout in POS or register them here for prescriptions.'
                    : 'Try a different search term.'
                }
                actionLabel={
                  patients.length === 0 ? 'Open POS' : undefined
                }
                actionHref={
                  patients.length === 0 ? PHARMACY_ROUTES.pos : undefined
                }
              />
              {patients.length === 0 && (
                <div className="mt-4 flex justify-center">
                  <DashboardButton tone="primary" onClick={() => setAddOpen(true)}>
                    Add patient
                  </DashboardButton>
                </div>
              )}
            </div>
          ) : (
            <ul className="space-y-2 p-4">
              {filtered.map((patient) => (
                <li key={patient.id}>
                  <PatientListRow
                    patient={patient}
                    onSelect={(p) => {
                      setSelectedId(p.id)
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
