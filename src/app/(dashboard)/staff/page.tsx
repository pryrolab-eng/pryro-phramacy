'use client'

import { useMemo, useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useUsers, staffUsersQueryKey } from '@/hooks'
import { createPharmacist } from '@/lib/http/pharmacist'
import { deleteStaffMember, updateStaffMember, type StaffUser } from '@/lib/http/staff'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserCog, Plus, Mail, Phone, Calendar } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { FeatureGate } from '@/components/subscription/feature-gate'

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

  const staff = useMemo((): StaffMember[] => {
    return (usersQuery.data ?? []).map((u) => ({
      ...u,
      status: u.status === 'inactive' ? 'inactive' : 'active',
    }))
  }, [usersQuery.data])

  const [isAddingStaff, setIsAddingStaff] = useState(false)
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'pharmacist',
    password: ''
  })
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [isEditingStaff, setIsEditingStaff] = useState(false)
  const [pharmacyLoading, setPharmacyLoading] = useState(true)
  const [userPharmacy, setUserPharmacy] = useState<{
    pharmacy_id: string
    pharmacy_name?: string
  } | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const { createClient } = await import('../../../../supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('pharmacy_users')
            .select('pharmacy_id, pharmacies(name)')
            .eq('user_id', user.id)
            .single()
          const row = data as {
            pharmacy_id?: string
            pharmacies?: { name?: string } | { name?: string }[] | null
          } | null
          const pharmacyJoin = row?.pharmacies
          const pharmacyName = Array.isArray(pharmacyJoin)
            ? pharmacyJoin[0]?.name
            : pharmacyJoin?.name
          if (row?.pharmacy_id) {
            setUserPharmacy({
              pharmacy_id: row.pharmacy_id,
              pharmacy_name: pharmacyName,
            })
          }
        }
      } catch (error) {
        console.error('Error fetching pharmacy:', error)
      } finally {
        setPharmacyLoading(false)
      }
    })()
  }, [])

  const loading = usersQuery.isPending || pharmacyLoading

  const handleAddStaff = async () => {
    if (!userPharmacy?.pharmacy_id) {
      toast.error('Pharmacy not found')
      return
    }
    try {
      const result = await createPharmacist({
        email: newStaff.email,
        password: newStaff.password.trim() || undefined,
        full_name: newStaff.name,
        phone: newStaff.phone,
        role: newStaff.role,
        pharmacy_id: userPharmacy.pharmacy_id,
        pharmacy_name: userPharmacy.pharmacy_name,
      })

      await queryClient.invalidateQueries({ queryKey: staffUsersQueryKey })
      setIsAddingStaff(false)
      setNewStaff({ name: '', email: '', phone: '', role: 'pharmacist', password: '' })

      if (result.emailSent) {
        toast.success('Invitation sent', {
          description: `Login instructions were emailed to ${newStaff.email}.`,
        })
      } else {
        toast.warning('Staff member created', {
          description:
            result.emailError ??
            'Account was created but the invitation email could not be sent. Check SMTP settings.',
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error adding pharmacist:', error)
      toast.error('Could not add staff member', { description: message })
    }
  }

  const toggleStaffStatus = async (id: string) => {
    try {
      const member = staff.find(s => s.id === id)
      const newStatus = member?.status === 'active' ? 'inactive' : 'active'

      queryClient.setQueryData<StaffUser[]>(staffUsersQueryKey, (old) => {
        if (!old) return old
        return old.map((u) =>
          u.id === id ? { ...u, status: newStatus } : u
        )
      })

      alert(`Staff member ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`)
    } catch (error) {
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
      password: ''
    })
    setIsEditingStaff(true)
  }

  const saveEditStaff = async () => {
    if (!editingStaff?.id) return
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
      alert('Staff member updated successfully!')
    } catch (error) {
      console.error('Error updating staff:', error)
      const message = error instanceof Error ? error.message : 'Error updating staff member'
      alert(message)
    }
  }

  const handleDeleteStaff = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      try {
        await deleteStaffMember(id)
        await queryClient.invalidateQueries({ queryKey: staffUsersQueryKey })
        alert('Staff member deleted successfully!')
      } catch (error) {
        console.error('Error deleting staff:', error)
        const message = error instanceof Error ? error.message : 'Error deleting staff member'
        alert(message)
      }
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-xl font-bold">Staff Management</h1>
            <p className="text-sm text-muted-foreground">Manage your pharmacy staff members</p>
            {usersQuery.isError ? (
              <p className="text-sm text-destructive mt-1" role="alert">
                {usersQuery.error instanceof Error ? usersQuery.error.message : 'Could not load staff.'}
              </p>
            ) : null}
          </div>
        </div>
        <FeatureGate featureKey="staff.invite" compact>
        <Dialog open={isAddingStaff} onOpenChange={setIsAddingStaff}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Pharmacist</DialogTitle>
              <DialogDescription>
                We email login instructions to the address below. Password is optional — leave blank to generate one automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="staff_name">Full Name</Label>
                <Input
                  id="staff_name"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff_email">Email</Label>
                <Input
                  id="staff_email"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff_phone">Phone</Label>
                <Input
                  id="staff_phone"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff_password">Password (optional)</Label>
                <PasswordInput
                  id="staff_password"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                  placeholder="Auto-generated and emailed if empty"
                />
              </div>

            </div>
            <DialogFooter>
              <Button onClick={handleAddStaff} disabled={!newStaff.email || !newStaff.name}>
                Send invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </FeatureGate>
      </div>

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
                  onClick={() => toggleStaffStatus(member.id)}
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
                  onClick={() => handleDeleteStaff(member.id, member.name)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isEditingStaff} onOpenChange={setIsEditingStaff}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>Update staff member information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Full Name</Label>
              <Input
                value={editingStaff?.name || ''}
                onChange={(e) => setEditingStaff({...editingStaff, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editingStaff?.email || ''}
                onChange={(e) => setEditingStaff({...editingStaff, email: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Phone</Label>
              <Input
                value={editingStaff?.phone || ''}
                onChange={(e) => setEditingStaff({...editingStaff, phone: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={editingStaff?.role || 'pharmacist'} onValueChange={(value) => setEditingStaff({...editingStaff, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pharmacist">Pharmacist</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>New Password (optional)</Label>
              <PasswordInput
                value={editingStaff?.password || ''}
                onChange={(e) => setEditingStaff({...editingStaff, password: e.target.value})}
                placeholder="Leave blank to keep current password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveEditStaff}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


