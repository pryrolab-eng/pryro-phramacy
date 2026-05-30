'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  useUsers,
} from '@/hooks/useUsers'
import {
  createPharmacist,
  type StaffInviteCredentials,
} from '@/lib/http/pharmacist'
import type { StaffUser } from '@/lib/http/staff'
import { staffStats } from '@/lib/staff/format-staff'
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardToolbar,
  DashboardButton,
  DashboardPageLoading,
  DashboardMetricGrid,
  DashboardStatCard,
  DashboardTableCard,
  DashboardSearchInput,
  DashboardPanelEmpty,
} from '@/components/dashboard'
import { StaffListRow } from '@/components/staff/staff-list-row'
import { StaffDetailSheet } from '@/components/staff/staff-detail-sheet'
import {
  StaffAddDialog,
  StaffAddDialogTrigger,
  type StaffInviteInput,
} from '@/components/staff/staff-add-dialog'
import { StaffInviteCredentialsDialog } from '@/components/staff/staff-invite-credentials-dialog'
import {
  Users,
  UserCheck,
  Stethoscope,
  Wallet,
  RefreshCw,
  UserPlus,
} from 'lucide-react'
import { FeatureGate } from '@/components/subscription/feature-gate'
import { useActivePharmacy } from '@/components/providers/active-pharmacy-provider'

export default function StaffManagePage() {
  const usersQuery = useUsers()
  const { activePharmacyId, context, isPending: ctxPending } = useActivePharmacy()

  const activeMembership = useMemo(
    () => context.memberships.find((m) => m.pharmacyId === activePharmacyId),
    [context.memberships, activePharmacyId],
  )

  const staff = usersQuery.data ?? []
  const stats = useMemo(() => staffStats(staff), [staff])

  const [searchTerm, setSearchTerm] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [invitePending, setInvitePending] = useState(false)
  const [selectedMember, setSelectedMember] = useState<StaffUser | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [credentialsOpen, setCredentialsOpen] = useState(false)
  const [pendingCredentials, setPendingCredentials] =
    useState<StaffInviteCredentials | null>(null)
  const [credentialsEmailError, setCredentialsEmailError] = useState<string>()
  const [credentialsMemberName, setCredentialsMemberName] = useState<string>()

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return staff
    return staff.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q),
    )
  }, [staff, searchTerm])

  const handleInvite = async (input: StaffInviteInput) => {
    if (!activePharmacyId) {
      toast.error('Pharmacy not found')
      return
    }
    setInvitePending(true)
    try {
      const result = await createPharmacist({
        email: input.email,
        password: input.password.trim() || undefined,
        full_name: input.name,
        phone: input.phone,
        role: input.role,
        pharmacy_id: activePharmacyId,
        pharmacy_name: activeMembership?.pharmacyName ?? undefined,
      })

      await usersQuery.refetch()

      if (result.emailSent) {
        toast.success('Invitation sent', {
          description: `Login instructions were emailed to ${input.email}.`,
        })
      } else if (result.credentials) {
        setPendingCredentials(result.credentials)
        setCredentialsEmailError(result.emailError)
        setCredentialsMemberName(input.name)
        setCredentialsOpen(true)
        toast.warning('Share login details manually', {
          description:
            result.emailError ??
            'The account was created but the invitation email could not be sent.',
        })
      } else {
        toast.warning('Staff member created', {
          description:
            result.emailError ??
            'Account was created but the invitation email could not be sent.',
        })
      }
    } catch (error) {
      toast.error('Could not add staff member', {
        description: error instanceof Error ? error.message : undefined,
      })
      throw error
    } finally {
      setInvitePending(false)
    }
  }

  if (usersQuery.isPending || ctxPending) {
    return <DashboardPageLoading label="Loading staff…" />
  }

  return (
    <FeatureGate featureKey="staff.access">
      <DashboardPageShell>
        <DashboardPageHeader
          title="Staff"
          description="Invite pharmacists and cashiers, manage roles and branch access"
          actions={
            <DashboardToolbar>
              <DashboardButton
                onClick={() => void usersQuery.refetch()}
                disabled={usersQuery.isFetching}
              >
                <RefreshCw
                  className={`mr-1.5 h-4 w-4 ${usersQuery.isFetching ? 'animate-spin' : ''}`}
                />
                Refresh
              </DashboardButton>
              <FeatureGate featureKey="staff.invite" compact>
                <StaffAddDialog
                  open={addOpen}
                  onOpenChange={setAddOpen}
                  onSubmit={handleInvite}
                  isPending={invitePending}
                  trigger={<StaffAddDialogTrigger />}
                />
              </FeatureGate>
            </DashboardToolbar>
          }
        />

        {usersQuery.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {usersQuery.error instanceof Error
              ? usersQuery.error.message
              : 'Could not load staff.'}
          </p>
        ) : null}

        <DashboardMetricGrid>
          <DashboardStatCard
            label="Team size"
            icon={Users}
            value={stats.total}
            hint="All members at this pharmacy"
          />
          <DashboardStatCard
            label="Active"
            icon={UserCheck}
            value={stats.active}
            hint="Can sign in and work"
          />
          <DashboardStatCard
            label="Pharmacists"
            icon={Stethoscope}
            value={stats.pharmacists}
            hint="Dispensing & clinical roles"
          />
          <DashboardStatCard
            label="Cashiers"
            icon={Wallet}
            value={stats.cashiers}
            hint="POS-focused roles"
          />
        </DashboardMetricGrid>

        <DashboardTableCard
          title="Team directory"
          description={`${filtered.length} of ${staff.length} shown`}
          toolbar={
            <DashboardSearchInput
              placeholder="Search name, email, phone, role…"
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
                title={staff.length === 0 ? 'No staff yet' : 'No matches'}
                description={
                  staff.length === 0
                    ? 'Invite your first pharmacist or cashier to help run the pharmacy.'
                    : 'Try a different search term.'
                }
              />
              {staff.length === 0 && (
                <div className="mt-4 flex justify-center">
                  <FeatureGate featureKey="staff.invite" compact>
                    <DashboardButton tone="primary" onClick={() => setAddOpen(true)}>
                      <UserPlus className="mr-1.5 h-4 w-4" />
                      Invite staff
                    </DashboardButton>
                  </FeatureGate>
                </div>
              )}
            </div>
          ) : (
            <ul className="space-y-2 p-4">
              {filtered.map((member) => (
                <li key={member.id}>
                  <StaffListRow
                    member={member}
                    onSelect={(m) => {
                      setSelectedMember(m)
                      setSheetOpen(true)
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </DashboardTableCard>

        <StaffDetailSheet
          member={selectedMember}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onDeleted={() => setSelectedMember(null)}
        />

        <StaffInviteCredentialsDialog
          open={credentialsOpen}
          onOpenChange={(open) => {
            setCredentialsOpen(open)
            if (!open) {
              setPendingCredentials(null)
              setCredentialsEmailError(undefined)
              setCredentialsMemberName(undefined)
            }
          }}
          credentials={pendingCredentials}
          emailError={credentialsEmailError}
          memberName={credentialsMemberName}
        />
      </DashboardPageShell>
    </FeatureGate>
  )
}
