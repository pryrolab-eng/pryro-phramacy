'use client'

import { useMemo, useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useUsers, staffUsersQueryKey } from '@/hooks'
import { createPharmacist } from '@/lib/http/pharmacist'
import { deleteStaffMember, updateStaffMember, type StaffUser } from '@/lib/http/staff'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  UserCog, Plus, Mail, Phone, Calendar, Users, Lock, Crown, Loader2,
} from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { useSaasSubscription } from '@/hooks/useSaasSubscription'
import { FeatureGate } from '@/components/feature-gate'
import { PlanQuotaWidget } from '@/components/plan-quota-widget'

interface StaffMember {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: 'active' | 'inactive'
  joinDate: string
}

export default function StaffManagePage() {
  const queryClient = useQueryClient()
  const usersQuery = useUsers()
  const subQuery = useSaasSubscription()

  const staff = useMemo((): StaffMember[] => {
    return (usersQuery.data ?? []).map((u) => ({
      ...u,
      status: u.status === 'inactive' ? 'inactive' : 'active',
    }))
  }, [usersQuery.data])

  // ── Subscription limits ───────────────────────────────
  const summary = subQuery.data
  const userLimit = summary?.main_subscription?.plan?.max_users ?? null
  const userCount = summary?.user_count ?? staff.length
  const atUserLimit = userLimit !== null && userCount >= userLimit
  const [limitDialogOpen, setLimitDialogOpen] = useState(false)

  // ── Form state ────────────────────────────────────────
  const [isAddingStaff, setIsAddingStaff] = useState(false)
  const [addingLoading, setAddingLoading] = useState(false)
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'pharmacist',
    password: '',
  })

  const [editingStaff, setEditingStaff] = useState<{
    id: string; name: string; email: string; phone: string; role: string; password: string
  } | null>(null)
  const [isEditingStaff, setIsEditingStaff] = useState(false)
  const [editingLoading, setEditingLoading] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deletingLoading, setDeletingLoading] = useState(false)

  const [pharmacyLoading, setPharmacyLoading] = useState(true)
  const [userPharmacy, setUserPharmacy] = useState<{ pharmacy_id: string } | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const { createClient } = await import('../../../../supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('pharmacy_users')
            .select('pharmacy_id')
            .eq('user_id', user.id)
            .single()
          setUserPharmacy(data)
        }
      } catch (error) {
        console.error('Error fetching pharmacy:', error)
      } finally {
        setPharmacyLoading(false)
      }
    })()
  }, [])

  const loading = usersQuery.isPending || pharmacyLoading

  // ── Handlers ──────────────────────────────────────────

  const handleAddClick = () => {
    if (atUserLimit) {
      setLimitDialogOpen(true)
      return
    }
    setIsAddingStaff(true)
  }

  const handleAddStaff = async () => {
    setAddingLoading(true)
    const tid = toast.loading('Creating staff member…')
    try {
      await createPharmacist({
        email: newStaff.email,
        password: newStaff.password,
        full_name: newStaff.name,
        phone: newStaff.phone,
        role: 'pharmacist',
        pharmacy_id: userPharmacy?.pharmacy_id ?? '',
      })

      await queryClient.invalidateQueries({ queryKey: staffUsersQueryKey })
      void subQuery.refetch()
      setIsAddingStaff(false)
      setNewStaff({ name: '', email: '', phone: '', role: 'pharmacist', password: '' })

      toast.success('Staff member created', {
        id: tid,
        description: `A welcome email with login credentials has been sent to ${newStaff.email}.`,
        duration: 6000,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (message.includes('User limit reached') || message.includes('USER_LIMIT_REACHED')) {
        toast.dismiss(tid)
        setIsAddingStaff(false)
        setLimitDialogOpen(true)
        return
      }
      toast.error('Failed to create staff member', {
        id: tid,
        description: message,
      })
    } finally {
      setAddingLoading(false)
    }
  }

  const toggleStaffStatus = async (id: string) => {
    const member = staff.find(s => s.id === id)
    const newStatus = member?.status === 'active' ? 'inactive' : 'active'
    const tid = toast.loading(`${newStatus === 'active' ? 'Activating' : 'Deactivating'} staff member…`)
    try {
      queryClient.setQueryData<StaffUser[]>(staffUsersQueryKey, (old) => {
        if (!old) return old
        return old.map((u) => u.id === id ? { ...u, status: newStatus } : u)
      })
      toast.success(`Staff member ${newStatus === 'active' ? 'activated' : 'deactivated'}`, { id: tid })
    } catch (error) {
      toast.error('Failed to update status', { id: tid })
      console.error('Error updating staff status:', error)
    }
  }

  const handleEditStaff = (member: StaffMember) => {
    setEditingStaff({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      role: member.role,
      password: '',
    })
    setIsEditingStaff(true)
  }

  const saveEditStaff = async () => {
    if (!editingStaff?.id) return
    setEditingLoading(true)
    const tid = toast.loading('Saving changes…')
    try {
      await updateStaffMember(editingStaff.id, {
        name: editingStaff.name,
        email: editingStaff.email,
        phone: editingStaff.phone,
        role: editingStaff.role,
        password: editingStaff.password?.trim() || undefined,
      })
      await queryClient.invalidateQueries({ queryKey: staffUsersQueryKey })
      setIsEditingStaff(false)
      setEditingStaff(null)
      toast.success('Staff member updated', { id: tid })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating staff member'
      toast.error('Update failed', { id: tid, description: message })
    } finally {
      setEditingLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeletingLoading(true)
    const tid = toast.loading(`Deleting ${deleteTarget.name}…`)
    try {
      await deleteStaffMember(deleteTarget.id)
      await queryClient.invalidateQueries({ queryKey: staffUsersQueryKey })
      toast.success('Staff member deleted', { id: tid })
      setDeleteTarget(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error deleting staff member'
      toast.error('Delete failed', { id: tid, description: message })
    } finally {
      setDeletingLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  return (
    <FeatureGate feature="staff_management">
      <div className="p-6 space-y-6 bg-gray-100 min-h-screen">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border" />
            <div>
              <h1 className="text-xl font-bold">Staff Management</h1>
              <p className="text-sm text-muted-foreground">Manage your pharmacy staff members</p>
              {usersQuery.isError && (
                <p className="text-sm text-destructive mt-1" role="alert">
                  {usersQuery.error instanceof Error ? usersQuery.error.message : 'Could not load staff.'}
                </p>
              )}
            </div>
          </div>
          <Button onClick={handleAddClick} disabled={atUserLimit}>
            {atUserLimit
              ? <Lock className="mr-2 h-4 w-4" />
              : <Plus className="mr-2 h-4 w-4" />}
            Add Staff Member
          </Button>
        </div>

        {/* Plan quota — compact live counter */}
        <PlanQuotaWidget variant="compact" />

        {/* User limit banner */}
        {userLimit !== null && (
          <Card className={atUserLimit ? 'border-amber-300 bg-amber-50' : ''}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {userCount} of {userLimit} staff used
                      {summary?.main_subscription?.plan?.name
                        ? ` · ${summary.main_subscription.plan.name} plan`
                        : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {atUserLimit
                        ? 'Limit reached — upgrade your plan to add more staff'
                        : `${userLimit - userCount} slot${userLimit - userCount !== 1 ? 's' : ''} remaining`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 min-w-[160px]">
                  <Progress
                    value={Math.min(100, (userCount / userLimit) * 100)}
                    className="flex-1 h-2"
                  />
                  <span className="text-xs font-medium whitespace-nowrap">
                    {userCount}/{userLimit}
                  </span>
                </div>
                {atUserLimit && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-400 text-amber-700 hover:bg-amber-100"
                    onClick={() => { window.location.href = '/pharmacy-dashboard/billing' }}
                  >
                    <Crown className="h-3.5 w-3.5 mr-1.5" />
                    Upgrade Plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Staff grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {staff.map((member) => (
            <Card key={member.id} className="p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserCog className="mr-1 h-4 w-4" />
                    <span className="font-medium text-sm truncate">{member.name}</span>
                  </div>
                  <Badge
                    variant={member.status === 'active' ? 'default' : 'secondary'}
                    className={`text-xs px-1 py-0 h-4 ${member.status === 'active' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                  >
                    {member.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground capitalize">{member.role}</p>

                <div className="space-y-1">
                  <div className="flex items-center text-xs">
                    <Mail className="mr-1 h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center text-xs">
                    <Phone className="mr-1 h-3 w-3 text-muted-foreground" />
                    {member.phone}
                  </div>
                  <div className="flex items-center text-xs">
                    <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                    {member.joinDate}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => void toggleStaffStatus(member.id)}
                  >
                    {member.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => handleEditStaff(member)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => setDeleteTarget({ id: member.id, name: member.name })}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Add Staff Dialog ── */}
        <Dialog open={isAddingStaff} onOpenChange={o => { if (!addingLoading) setIsAddingStaff(o) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Create a new pharmacist account. They will receive an email with their login credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="staff_name">Full Name</Label>
                <Input
                  id="staff_name"
                  value={newStaff.name}
                  onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="e.g. Jean Bosco"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff_email">Email</Label>
                <Input
                  id="staff_email"
                  type="email"
                  value={newStaff.email}
                  onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="staff@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff_phone">Phone</Label>
                <Input
                  id="staff_phone"
                  value={newStaff.phone}
                  onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                  placeholder="+250788123456"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff_password">Password</Label>
                <PasswordInput
                  id="staff_password"
                  value={newStaff.password}
                  onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                A welcome email with these credentials will be sent to the staff member.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddingStaff(false)}
                disabled={addingLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void handleAddStaff()}
                disabled={!newStaff.email || !newStaff.password || !newStaff.name || addingLoading}
              >
                {addingLoading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
                  : 'Add Staff Member'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Edit Staff Dialog ── */}
        <Dialog open={isEditingStaff} onOpenChange={o => { if (!editingLoading) setIsEditingStaff(o) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
              <DialogDescription>Update staff member information</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Full Name</Label>
                <Input
                  value={editingStaff?.name ?? ''}
                  onChange={e => setEditingStaff(prev => prev ? { ...prev, name: e.target.value } : prev)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingStaff?.email ?? ''}
                  onChange={e => setEditingStaff(prev => prev ? { ...prev, email: e.target.value } : prev)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Phone</Label>
                <Input
                  value={editingStaff?.phone ?? ''}
                  onChange={e => setEditingStaff(prev => prev ? { ...prev, phone: e.target.value } : prev)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={editingStaff?.role ?? 'pharmacist'}
                  onValueChange={v => setEditingStaff(prev => prev ? { ...prev, role: v } : prev)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pharmacist">Pharmacist</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>New Password <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <PasswordInput
                  value={editingStaff?.password ?? ''}
                  onChange={e => setEditingStaff(prev => prev ? { ...prev, password: e.target.value } : prev)}
                  placeholder="Leave blank to keep current password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditingStaff(false)}
                disabled={editingLoading}
              >
                Cancel
              </Button>
              <Button onClick={() => void saveEditStaff()} disabled={editingLoading}>
                {editingLoading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
                  : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Delete confirm dialog ── */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={o => { if (!o && !deletingLoading) setDeleteTarget(null) }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete staff member?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove <strong>{deleteTarget?.name}</strong> from your pharmacy.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletingLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => void handleDeleteConfirm()}
                disabled={deletingLoading}
              >
                {deletingLoading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</>
                  : 'Yes, delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── User limit reached dialog ── */}
        <AlertDialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-500" />
                Staff Limit Reached
              </AlertDialogTitle>
              <AlertDialogDescription>
                Your current plan allows {userLimit} staff member{userLimit !== 1 ? 's' : ''}.
                You have used all {userLimit} slot{userLimit !== 1 ? 's' : ''}.
                Upgrade your plan to add more staff.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setLimitDialogOpen(false)
                  window.location.href = '/pharmacy-dashboard/billing'
                }}
              >
                <Crown className="h-4 w-4 mr-2" />
                View Plans
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </FeatureGate>
  )
}
