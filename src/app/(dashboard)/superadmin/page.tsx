'use client'

import { useState, useEffect } from 'react'
import { usePharmacyStore } from '@/hooks/usePharmacyStore'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Users, CreditCard, TrendingUp, Plus, MapPin, Crown, Pill, Shield, FileText } from 'lucide-react'
import { RealtimeStatus } from '@/components/RealtimeStatus'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface DashboardStats {
  totalPharmacies: number
  activePharmacies: number
  totalRevenue: number
  monthlyGrowth: number
  totalUsers: number
  newRegistrations: number
}

interface Pharmacy {
  id: string
  name: string
  location: string
  owner: string
  status: string
  plan: string
  created_at: string
}

interface Insurance {
  id: string
  name: string
  coverage_percentage: number
  is_active: boolean
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPharmacies: 0,
    activePharmacies: 0,
    totalRevenue: 1250000,
    monthlyGrowth: 15.2,
    totalUsers: 156,
    newRegistrations: 8
  })
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [insurance, setInsurance] = useState<Insurance[]>([])
  const [isAddingPharmacy, setIsAddingPharmacy] = useState(false)
  const [isAddingInsurance, setIsAddingInsurance] = useState(false)
  const [newPharmacy, setNewPharmacy] = useState({
    name: '',
    location: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    owner_password: '',
    plan: 'free',
    insurance_providers: []
  })
  const [newInsurance, setNewInsurance] = useState({
    name: '',
    coverage_percentage: 80,
    contact_email: '',
    contact_phone: '',
    policy_number: '',
    invoice_template: 'default',
    template_html: ''
  })

  const { inventory, sales, alerts } = usePharmacyStore()

  // Real-time updates
  useRealtimeUpdates((update) => {
    if (update.type === 'new_sale' || update.type === 'inventory_update') {
      fetchDashboardStats()
      fetchPharmacies()
    }
  })

  useEffect(() => {
    fetchInsurance()
    fetchPharmacies()
    fetchDashboardStats()
    
    const interval = setInterval(() => {
      fetchInsurance()
      fetchPharmacies()
      fetchDashboardStats()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/superadmin/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  const fetchPharmacies = async () => {
    try {
      const response = await fetch('/api/superadmin/pharmacies')
      if (response.ok) {
        const data = await response.json()
        const formattedPharmacies = data.map(p => ({
          id: p.id,
          name: p.name,
          location: p.address || p.city || 'Unknown',
          owner: p.owner_name || 'Unknown',
          status: p.status || 'active',
          plan: p.subscription_plan || 'free',
          created_at: p.created_at?.split('T')[0] || new Date().toISOString().split('T')[0]
        }))
        setPharmacies(formattedPharmacies)
        setStats(prev => ({ 
          ...prev, 
          totalPharmacies: formattedPharmacies.length,
          activePharmacies: formattedPharmacies.filter(p => p.status === 'active').length
        }))
      }
    } catch (error) {
      console.error('Error fetching pharmacies:', error)
    }
  }

  const handleInsuranceChange = (insuranceId: string, checked: boolean) => {
    if (checked) {
      setNewPharmacy({
        ...newPharmacy,
        insurance_providers: [...newPharmacy.insurance_providers, insuranceId]
      })
    } else {
      setNewPharmacy({
        ...newPharmacy,
        insurance_providers: newPharmacy.insurance_providers.filter(id => id !== insuranceId)
      })
    }
  }

  const fetchInsurance = async () => {
    try {
      const response = await fetch('/api/insurance')
      if (response.ok) {
        const data = await response.json()
        setInsurance(data)
      }
    } catch (error) {
      console.error('Error fetching insurance:', error)
    }
  }

  const handleAddPharmacy = async () => {
    try {
      // Use the same API endpoint as admin stores page
      const response = await fetch('/api/superadmin/pharmacies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPharmacy.name,
          address: newPharmacy.location,
          phone: newPharmacy.owner_phone,
          email: newPharmacy.owner_email,
          license_number: `LIC-${Date.now()}`,
          owner_name: newPharmacy.owner_name,
          owner_email: newPharmacy.owner_email,
          owner_password: newPharmacy.owner_password,
          subscription_plan: newPharmacy.plan,
          insurance_providers: newPharmacy.insurance_providers
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        const pharmacy = {
          id: result.pharmacy?.id || Date.now().toString(),
          name: newPharmacy.name,
          location: newPharmacy.location,
          owner: newPharmacy.owner_name,
          status: 'active',
          plan: newPharmacy.plan,
          created_at: new Date().toISOString().split('T')[0]
        }
        
        // Force refresh both lists
        await fetchPharmacies()
        
        // Broadcast update to all connected systems
        await fetch('/api/notifications/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'pharmacy_created',
            data: { pharmacy }
          })
        }).catch(() => {})
        
        setIsAddingPharmacy(false)
        setNewPharmacy({ name: '', location: '', owner_name: '', owner_email: '', owner_phone: '', owner_password: '', plan: 'free', insurance_providers: [] })
        alert('Pharmacy created successfully!')
      } else {
        alert(result.error || 'Failed to create pharmacy')
      }
    } catch (error) {
      console.error('Error creating pharmacy:', error)
      alert('Error creating pharmacy')
    }
  }

  const handleAddInsurance = async () => {
    try {
      const response = await fetch('/api/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInsurance)
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          await fetchInsurance()
          
          // Broadcast insurance update
          await fetch('/api/notifications/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'insurance_added',
              data: { insurance: newInsurance }
            })
          }).catch(() => {})
          
          setIsAddingInsurance(false)
          setNewInsurance({ name: '', coverage_percentage: 80, contact_email: '', contact_phone: '', policy_number: '', invoice_template: 'default', template_html: '' })
          alert('Insurance provider added successfully!')
        } else {
          alert('Failed to add insurance provider')
        }
      } else {
        alert('Failed to add insurance provider')
      }
    } catch (error) {
      console.error('Error adding insurance:', error)
      alert('Error adding insurance provider')
    }
  }



  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
              <RealtimeStatus />
            </div>
            <p className="text-muted-foreground">Platform overview and management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddingPharmacy} onOpenChange={setIsAddingPharmacy}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Pharmacy
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={isAddingInsurance} onOpenChange={setIsAddingInsurance}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Shield className="mr-2 h-4 w-4" />
                Add Insurance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Insurance Provider</DialogTitle>
                <DialogDescription>Create a new insurance provider with custom invoice template</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Insurance Name</Label>
                    <Input
                      value={newInsurance.name}
                      onChange={(e) => setNewInsurance({...newInsurance, name: e.target.value})}
                      placeholder="e.g., RSSB, MMI"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Coverage Percentage</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={newInsurance.coverage_percentage}
                      onChange={(e) => setNewInsurance({...newInsurance, coverage_percentage: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      value={newInsurance.contact_email || ''}
                      onChange={(e) => setNewInsurance({...newInsurance, contact_email: e.target.value})}
                      placeholder="contact@insurance.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Contact Phone</Label>
                    <Input
                      value={newInsurance.contact_phone || ''}
                      onChange={(e) => setNewInsurance({...newInsurance, contact_phone: e.target.value})}
                      placeholder="+250 xxx xxx xxx"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Policy Number</Label>
                  <Input
                    value={newInsurance.policy_number || ''}
                    onChange={(e) => setNewInsurance({...newInsurance, policy_number: e.target.value})}
                    placeholder="Policy reference number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Invoice Template</Label>
                  <Select value={newInsurance.invoice_template || 'default'} onValueChange={(value) => setNewInsurance({...newInsurance, invoice_template: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Template</SelectItem>
                      <SelectItem value="rssb">RSSB Format</SelectItem>
                      <SelectItem value="mmi">MMI Format</SelectItem>
                      <SelectItem value="radiant">Radiant Format</SelectItem>
                      <SelectItem value="custom">Custom Format</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newInsurance.invoice_template === 'custom' && (
                  <div className="grid gap-2">
                    <Label>Custom Template</Label>
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <p className="text-sm text-blue-800 mb-2">Create a custom template using our template designer</p>
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => window.open('/admin/insurance-templates', '_blank')}
                        className="w-full"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Open Template Designer
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleAddInsurance} disabled={!newInsurance.name}>
                  Add Insurance Provider
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Dialog open={isAddingPharmacy} onOpenChange={setIsAddingPharmacy}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Pharmacy</DialogTitle>
              <DialogDescription>Create a new pharmacy account</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Pharmacy Name</Label>
                  <Input
                    id="name"
                    value={newPharmacy.name}
                    onChange={(e) => setNewPharmacy({...newPharmacy, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newPharmacy.location}
                    onChange={(e) => setNewPharmacy({...newPharmacy, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="owner_name">Owner Name</Label>
                  <Input
                    id="owner_name"
                    value={newPharmacy.owner_name}
                    onChange={(e) => setNewPharmacy({...newPharmacy, owner_name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="owner_email">Owner Email</Label>
                  <Input
                    id="owner_email"
                    type="email"
                    value={newPharmacy.owner_email}
                    onChange={(e) => setNewPharmacy({...newPharmacy, owner_email: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="owner_phone">Owner Phone</Label>
                  <Input
                    id="owner_phone"
                    value={newPharmacy.owner_phone}
                    onChange={(e) => setNewPharmacy({...newPharmacy, owner_phone: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="owner_password">Owner Password</Label>
                  <Input
                    id="owner_password"
                    type="password"
                    value={newPharmacy.owner_password}
                    onChange={(e) => setNewPharmacy({...newPharmacy, owner_password: e.target.value})}
                    placeholder="Minimum 8 characters"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="plan">Subscription Plan</Label>
                  <Select value={newPharmacy.plan} onValueChange={(value) => setNewPharmacy({...newPharmacy, plan: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Insurance Providers</Label>
                  <div className="space-y-3 max-h-40 overflow-y-auto border rounded p-3">
                    {insurance.map(provider => (
                      <div key={provider.id} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`insurance-${provider.id}`}
                            checked={newPharmacy.insurance_providers.includes(provider.id)}
                            onChange={(e) => handleInsuranceChange(provider.id, e.target.checked)}
                          />
                          <label htmlFor={`insurance-${provider.id}`} className="text-sm font-medium">
                            {provider.name}
                          </label>
                        </div>
                        {newPharmacy.insurance_providers.includes(provider.id) && (
                          <div className="ml-6 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Coverage: {provider.coverage_percentage}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={provider.coverage_percentage}
                              onChange={(e) => {
                                const updatedInsurance = insurance.map(ins => 
                                  ins.id === provider.id 
                                    ? {...ins, coverage_percentage: Number(e.target.value)}
                                    : ins
                                )
                                setInsurance(updatedInsurance)
                              }}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddPharmacy} disabled={!newPharmacy.name || !newPharmacy.owner_email || !newPharmacy.owner_password}>Create Pharmacy</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pharmacies</CardTitle>
            <Building2 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPharmacies}</div>
            <p className="text-xs text-muted-foreground">{stats.activePharmacies} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <CreditCard className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} RWF</div>
            <p className="text-xs text-muted-foreground">+{stats.monthlyGrowth}% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Across all pharmacies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{stats.monthlyGrowth}%</div>
            <p className="text-xs text-muted-foreground">{stats.newRegistrations} new this month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Insurance Providers</CardTitle>
            <CardDescription>Manage insurance coverage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insurance.map((provider) => (
                <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{provider.name}</p>
                      <p className="text-sm text-muted-foreground">{provider.coverage_percentage}% coverage</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    provider.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {provider.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Pharmacies</CardTitle>
            <CardDescription>Latest pharmacy registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pharmacies.slice(0, 5).map((pharmacy) => (
                <div key={pharmacy.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{pharmacy.name}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-1" />
                        {pharmacy.location}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      pharmacy.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {pharmacy.status}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{pharmacy.plan}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test User Credentials</CardTitle>
            <CardDescription>Use these accounts to test different roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-blue-900">Super Admin</p>
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <Crown className="h-3 w-3 text-white" />
                  </div>
                </div>
                <p className="text-sm text-blue-700">Email: abdousentore@gmail.com</p>
                <p className="text-sm text-blue-700">Password: admin123</p>
              </div>
              
              <div className="p-4 border rounded-lg bg-green-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-green-900">Pharmacy Owner</p>
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <Building2 className="h-3 w-3 text-white" />
                  </div>
                </div>
                <p className="text-sm text-green-700">Email: pharmacy@test.com</p>
                <p className="text-sm text-green-700">Password: pharmacy123</p>
              </div>
              
              <div className="p-4 border rounded-lg bg-purple-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-purple-900">Pharmacist</p>
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <Pill className="h-3 w-3 text-white" />
                  </div>
                </div>
                <p className="text-sm text-purple-700">Email: pharmacist@test.com</p>
                <p className="text-sm text-purple-700">Password: pharmacist123</p>
              </div>
              
              <div className="p-4 border rounded-lg bg-orange-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-orange-900">Cashier</p>
                  <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                    <Users className="h-3 w-3 text-white" />
                  </div>
                </div>
                <p className="text-sm text-orange-700">Email: cashier@test.com</p>
                <p className="text-sm text-orange-700">Password: cashier123</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}