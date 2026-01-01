'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Plus, Phone, Mail, Calendar } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  dateOfBirth: string
  allergies: string
  insurance: string
  totalPurchases: number
  lastVisit: string
  status: 'active' | 'inactive'
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([
    { id: '1', name: 'Marie Uwimana', phone: '+250788123456', email: 'marie@email.com', dateOfBirth: '1985-03-15', allergies: 'Penicillin', insurance: 'RSSB', totalPurchases: 45000, lastVisit: '2024-12-01', status: 'active' },
    { id: '2', name: 'Jean Baptiste', phone: '+250788123457', email: 'jean@email.com', dateOfBirth: '1978-07-22', allergies: 'None', insurance: 'MMI', totalPurchases: 23000, lastVisit: '2024-11-28', status: 'active' }
  ])
  const [stats, setStats] = useState({
    totalCustomers: 156,
    activeCustomers: 142,
    newThisMonth: 12
  })
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    dateOfBirth: '',
    allergies: '',
    insurance: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
        setStats({
          totalCustomers: data.length,
          activeCustomers: data.filter(c => c.status === 'active').length,
          newThisMonth: Math.floor(data.length * 0.1)
        })
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }

  const handleAddCustomer = async () => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      })
      
      if (response.ok) {
        const customer: Customer = {
          id: Date.now().toString(),
          ...newCustomer,
          totalPurchases: 0,
          lastVisit: new Date().toISOString().split('T')[0],
          status: 'active'
        }
        setCustomers([...customers, customer])
        setStats(prev => ({ ...prev, totalCustomers: prev.totalCustomers + 1, activeCustomers: prev.activeCustomers + 1 }))
        setIsAddingCustomer(false)
        setNewCustomer({ name: '', phone: '', email: '', dateOfBirth: '', allergies: '', insurance: '' })
      }
    } catch (error) {
      console.error('Error adding customer:', error)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-xl font-bold">Patient Management</h1>
            <p className="text-sm text-muted-foreground">Manage patient records, prescriptions, and medical information</p>
          </div>
        </div>
        <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>Add a new patient to your pharmacy records</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Full Name</Label>
                <Input 
                  placeholder="e.g. Marie Uwimana" 
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Phone Number</Label>
                <Input 
                  placeholder="+250788123456" 
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Email Address</Label>
                <Input 
                  type="email"
                  placeholder="marie@email.com" 
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Date of Birth</Label>
                <Input 
                  type="date"
                  value={newCustomer.dateOfBirth}
                  onChange={(e) => setNewCustomer({...newCustomer, dateOfBirth: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Known Allergies</Label>
                <Input 
                  placeholder="e.g. Penicillin, Aspirin (or None)" 
                  value={newCustomer.allergies}
                  onChange={(e) => setNewCustomer({...newCustomer, allergies: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Insurance Provider</Label>
                <Input 
                  placeholder="e.g. RSSB, MMI, Radiant" 
                  value={newCustomer.insurance}
                  onChange={(e) => setNewCustomer({...newCustomer, insurance: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddCustomer} disabled={!newCustomer.name || !newCustomer.phone}>
                Add Patient
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" onClick={fetchCustomers}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCustomers || 156}</div>
            <div className="h-8 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:140},{v:145},{v:150},{v:152},{v:154},{v:stats?.totalCustomers || 156}]}>
                  <Area type="monotone" dataKey="v" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.08} strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCustomers || 142}</div>
            <div className="h-8 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:135},{v:138},{v:140},{v:141},{v:142},{v:stats?.activeCustomers || 142}]}>
                  <Area type="monotone" dataKey="v" stroke="#10b981" fill="#10b981" fillOpacity={0.08} strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.newThisMonth || 12}</div>
            <div className="h-8 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:8},{v:10},{v:11},{v:12},{v:11},{v:stats?.newThisMonth || 12}]}>
                  <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Patient Records</CardTitle>
          <CardDescription>Manage patient information and medical history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(customers || []).map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {customer.phone}
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {customer.insurance}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Allergies: {customer.allergies || 'None'}
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold">{customer.totalPurchases.toLocaleString()} RWF</p>
                  <p className="text-sm text-muted-foreground">Last visit: {customer.lastVisit}</p>
                  <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                    {customer.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}