'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserCog, Plus, Mail, Phone, Calendar } from 'lucide-react'

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
  const [staff, setStaff] = useState<StaffMember[]>([])
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

  useEffect(() => {
    fetchStaff()
    const interval = setInterval(fetchStaff, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff')
      if (response.ok) {
        const data = await response.json()
        setStaff(data)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const handleAddStaff = async () => {
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newStaff.email,
          password: newStaff.password,
          full_name: newStaff.name,
          phone: newStaff.phone,
          role: newStaff.role
        })
      })
      
      if (response.ok) {
        await fetchStaff()
        setIsAddingStaff(false)
        setNewStaff({ name: '', email: '', phone: '', role: 'pharmacist', password: '' })
        alert('Staff member added successfully!')
        window.location.reload()
      } else {
        alert('Failed to add staff member')
      }
    } catch (error) {
      console.error('Error adding staff:', error)
      alert('Error adding staff member')
    }
  }

  const toggleStaffStatus = async (id: string) => {
    try {
      const member = staff.find(s => s.id === id)
      const newStatus = member?.status === 'active' ? 'inactive' : 'active'
      
      setStaff(staff.map(member => 
        member.id === id 
          ? { ...member, status: newStatus }
          : member
      ))
      
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
    try {
      const response = await fetch(`/api/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStaff)
      })
      
      if (response.ok) {
        setStaff(staff.map(member => 
          member.id === editingStaff.id 
            ? { ...member, ...editingStaff }
            : member
        ))
        
        setIsEditingStaff(false)
        setEditingStaff(null)
        alert('Staff member updated successfully!')
      } else {
        alert('Failed to update staff member')
      }
    } catch (error) {
      console.error('Error updating staff:', error)
      alert('Error updating staff member')
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage your pharmacy staff members</p>
        </div>
        <Dialog open={isAddingStaff} onOpenChange={setIsAddingStaff}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>Create a new staff account for your pharmacy</DialogDescription>
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
                <Label htmlFor="staff_password">Password</Label>
                <Input
                  id="staff_password"
                  type="password"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="staff_role">Role</Label>
                <Select value={newStaff.role} onValueChange={(value) => setNewStaff({...newStaff, role: value})}>
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
            </div>
            <DialogFooter>
              <Button onClick={handleAddStaff} disabled={!newStaff.email || !newStaff.password || !newStaff.name}>
                Add Staff Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staff.map((member) => (
          <Card key={member.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <UserCog className="mr-2 h-5 w-5" />
                  {member.name}
                </CardTitle>
                <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                  {member.status}
                </Badge>
              </div>
              <CardDescription className="capitalize">{member.role}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-sm">
                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                {member.email}
              </div>
              <div className="flex items-center text-sm">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                {member.phone}
              </div>
              <div className="flex items-center text-sm">
                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                Joined {member.joinDate}
              </div>
              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => toggleStaffStatus(member.id)}
                >
                  {member.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditStaff(member)}
                >
                  Edit
                </Button>
              </div>
            </CardContent>
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
              <Input
                type="password"
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