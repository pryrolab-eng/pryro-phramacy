'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Settings, CreditCard, Users, Building2, Check, Globe, DollarSign, ArrowUpRight, Shield, Bell, Download, Edit, Save, X, Zap, BarChart3, Database, Key, Webhook, Monitor, Palette, FileText, AlertTriangle, Clock, Plus } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { ResponsiveContainer, LineChart, Line } from 'recharts'

interface SubscriptionPlan {
  name: string
  price: number
  features: string[]
  current: boolean
}

export default function SettingsPage() {
  const [currentPlan, setCurrentPlan] = useState('standard')
  const [pharmacyInfo, setPharmacyInfo] = useState({
    name: '',
    license: '',
    location: '',
    phone: '',
    email: '',
    currency: 'RWF',
    language: 'en'
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isBillingOpen, setIsBillingOpen] = useState(false)
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false)
  const [isAddApiKeyOpen, setIsAddApiKeyOpen] = useState(false)
  const [isEditApiKeyOpen, setIsEditApiKeyOpen] = useState(false)
  const [isIpWhitelistOpen, setIsIpWhitelistOpen] = useState(false)
  const [ipWhitelist, setIpWhitelist] = useState<any[]>([])
  const [newIp, setNewIp] = useState({ ip: '', description: '' })
  const [ipWhitelistEnabled, setIpWhitelistEnabled] = useState(false)
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verifyCode, setVerifyCode] = useState('')
  const [setupStep, setSetupStep] = useState<'qr' | 'verify' | 'backup'>('qr')

  const fetchIpWhitelist = async () => {
    try {
      const response = await fetch('/api/settings/security/ip-whitelist/manage')
      if (response.ok) {
        const data = await response.json()
        setIpWhitelist(data.ips || [])
      }
    } catch (error) {
      console.error('Error fetching IP whitelist:', error)
    }
  }

  const fetchSecuritySettings = async () => {
    try {
      const response = await fetch('/api/settings/security')
      if (response.ok) {
        const data = await response.json()
        setIpWhitelistEnabled(data.ip_whitelist_enabled || false)
      }
    } catch (error) {
      console.error('Error fetching security settings:', error)
    }
  }

  const fetch2FAStatus = async () => {
    try {
      const response = await fetch('/api/settings/security/2fa')
      if (response.ok) {
        const data = await response.json()
        setIs2FAEnabled(data.enabled || false)
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error)
    }
  }

  const toggleIpWhitelist = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/settings/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip_whitelist_enabled: enabled })
      })
      if (response.ok) {
        setIpWhitelistEnabled(enabled)
      }
    } catch (error) {
      console.error('Error updating IP whitelist setting:', error)
    }
  }

  useEffect(() => {
    if (isIpWhitelistOpen) {
      fetchIpWhitelist()
    }
  }, [isIpWhitelistOpen])
  const [selectedApiKey, setSelectedApiKey] = useState<any>(null)
  const [newApiKey, setNewApiKey] = useState({ name: '', key: '' })
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [stockLocations, setStockLocations] = useState([])
  const [newLocation, setNewLocation] = useState({ name: '', description: '' })
  const [editInfo, setEditInfo] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    currency: 'RWF',
    language: 'en'
  })
  const [billingInfo, setBillingInfo] = useState({
    nextBilling: '2024-01-15',
    amount: 25000,
    paymentMethod: 'Mobile Money',
    invoices: [
      { id: '1', date: '2023-12-15', amount: 25000, status: 'Paid' },
      { id: '2', date: '2023-11-15', amount: 25000, status: 'Paid' }
    ]
  })

  const fetchBillingInfo = async () => {
    try {
      const response = await fetch('/api/invoices')
      if (response.ok) {
        const data = await response.json()
        setBillingInfo({
          nextBilling: data.nextBilling || '2024-01-15',
          amount: data.amount || 0,
          paymentMethod: data.paymentMethod || 'Not set',
          invoices: data.invoices || []
        })
      }
    } catch (error) {
      console.error('Error fetching billing info:', error)
    }
  }

  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchPharmacyInfo(),
        fetchPlans(),
        fetchStockLocations(),
        fetchApiKeys(),
        fetchSecuritySettings(),
        fetch2FAStatus(),
        fetchBillingInfo()
      ])
      setLoading(false)
    }
    loadData()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.map((plan: any) => ({
          name: plan.name,
          price: plan.price,
          current: currentPlan === plan.name.toLowerCase(),
          features: plan.features
        })))
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
      // Mock data for demo
      setPlans([
        { name: 'Basic', price: 15000, current: currentPlan === 'basic', features: ['Up to 100 products', 'Basic reporting', 'Email support'] },
        { name: 'Standard', price: 25000, current: currentPlan === 'standard', features: ['Up to 500 products', 'Advanced reporting', 'Priority support', 'Insurance integration'] },
        { name: 'Premium', price: 45000, current: currentPlan === 'premium', features: ['Unlimited products', 'Real-time analytics', '24/7 support', 'Multi-branch', 'API access'] }
      ])
    }
  }

  useEffect(() => {
    if (plans.length > 0) {
      setPlans(plans.map(plan => ({
        ...plan,
        current: currentPlan === plan.name.toLowerCase()
      })))
    }
  }, [currentPlan])

  const fetchPharmacyInfo = async () => {
    try {
      const response = await fetch('/api/pharmacy/settings')
      if (response.ok) {
        const data = await response.json()
        const info = {
          name: data.name,
          license: data.license,
          location: data.location,
          phone: data.phone,
          email: data.email
        }
        setPharmacyInfo(info)
        setEditInfo({
          name: data.name,
          location: data.location,
          phone: data.phone,
          email: data.email,
          currency: data.currency || 'RWF',
          language: data.language || 'en'
        })
        setCurrentPlan(data.subscription)
      }
    } catch (error) {
      console.error('Error fetching pharmacy info:', error)
      // Mock data for demo
      setPharmacyInfo({
        name: 'Pryrox Pharmacy',
        license: 'PH-2024-001',
        location: 'Kigali, Rwanda',
        phone: '+250788123456',
        email: 'info@pryrox.com',
        currency: 'RWF',
        language: 'en'
      })
      setEditInfo({
        name: 'Pryrox Pharmacy',
        location: 'Kigali, Rwanda',
        phone: '+250788123456',
        email: 'info@pryrox.com',
        currency: 'RWF',
        language: 'en'
      })
    }
  }

  const handleSaveEdit = async () => {
    try {
      const response = await fetch('/api/pharmacy/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editInfo)
      })
      
      if (response.ok) {
        setPharmacyInfo({...pharmacyInfo, ...editInfo})
        setIsEditing(false)
        alert('Information updated successfully!')
      }
    } catch (error) {
      console.error('Error updating pharmacy info:', error)
    }
  }

  const handleUpgrade = async (planName: string) => {
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planName })
      })
      
      if (response.ok) {
        setCurrentPlan(planName.toLowerCase())
        await fetchPharmacyInfo()
        await fetchBillingInfo()
        alert(`Successfully upgraded to ${planName} plan!`)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to upgrade plan')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Failed to upgrade plan')
    }
  }

  const fetchStockLocations = async () => {
    try {
      const response = await fetch('/api/settings/locations')
      if (response.ok) {
        const data = await response.json()
        setStockLocations(data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/settings/api-keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data)
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    }
  }

  const handleAddLocation = async () => {
    try {
      const response = await fetch('/api/settings/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLocation)
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        await fetchStockLocations()
        setIsAddLocationOpen(false)
        setNewLocation({ name: '', description: '' })
        alert('Location added successfully!')
      } else {
        alert(result.error || 'Failed to add location')
      }
    } catch (error) {
      console.error('Error adding location:', error)
      alert('Failed to add location')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your pharmacy settings and subscription</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Settings
          </Button>
          <Button size="sm">
            <Save className="mr-2 h-4 w-4" />
            Save All
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Plan</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{currentPlan}</div>
            <div className="h-8 mt-2 drop-shadow-md">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{v:20000},{v:22000},{v:25000},{v:25000},{v:25000},{v:25000}]}>
                  <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              {plans.find(p => p.name.toLowerCase() === currentPlan)?.price.toLocaleString()} RWF/month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Billing</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingInfo.nextBilling}</div>
            <div className="h-8 mt-2 drop-shadow-md">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{v:25000},{v:25000},{v:25000},{v:25000},{v:25000},{v:25000}]}>
                  <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Check className="h-3 w-3 text-green-500 mr-1" />
              {billingInfo.amount.toLocaleString()} RWF due
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Method</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingInfo.paymentMethod}</div>
            <div className="h-8 mt-2 drop-shadow-md">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{v:100},{v:100},{v:100},{v:100},{v:100},{v:100}]}>
                  <Line type="monotone" dataKey="v" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Shield className="h-3 w-3 text-green-500 mr-1" />
              Secure & verified
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settings Status</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Settings className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Complete</div>
            <div className="h-8 mt-2 drop-shadow-md">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{v:70},{v:80},{v:85},{v:90},{v:95},{v:95}]}>
                  <Line type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Check className="h-3 w-3 text-green-500 mr-1" />
              All configured
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Building2 className="mr-2 h-4 w-4 text-blue-500" />
                  Pharmacy Information
                </CardTitle>
                <CardDescription>Your pharmacy details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!isEditing ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Name</p>
                        <p className="text-muted-foreground">{pharmacyInfo.name || 'Not set'}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">License Number</p>
                      <p className="text-muted-foreground">{pharmacyInfo.license || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-muted-foreground">{pharmacyInfo.location || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-muted-foreground">{pharmacyInfo.phone || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">{pharmacyInfo.email || 'Not set'}</p>
                    </div>
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Information
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Pharmacy Name</Label>
                      <Input
                        id="name"
                        value={editInfo.name}
                        onChange={(e) => setEditInfo({...editInfo, name: e.target.value})}
                        placeholder="Enter pharmacy name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editInfo.location}
                        onChange={(e) => setEditInfo({...editInfo, location: e.target.value})}
                        placeholder="Enter location"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editInfo.phone}
                        onChange={(e) => setEditInfo({...editInfo, phone: e.target.value})}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editInfo.email}
                        onChange={(e) => setEditInfo({...editInfo, email: e.target.value})}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit}>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Globe className="mr-2 h-4 w-4 text-green-500" />
                  System Preferences
                </CardTitle>
                <CardDescription>Currency, language and regional settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={editInfo.currency} onValueChange={(value) => setEditInfo({...editInfo, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RWF">Rwandan Franc (RWF)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                      <SelectItem value="UGX">Ugandan Shilling (UGX)</SelectItem>
                      <SelectItem value="TZS">Tanzanian Shilling (TZS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={editInfo.language} onValueChange={(value) => setEditInfo({...editInfo, language: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="rw">Kinyarwanda</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="sw">Kiswahili</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSaveEdit} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="billing" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <CreditCard className="mr-2 h-4 w-4 text-blue-500" />
                  Current Subscription
                </CardTitle>
                <CardDescription>Your active plan and billing details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{currentPlan} Plan</p>
                      <p className="text-sm text-muted-foreground">
                        {plans.find(p => p.name.toLowerCase() === currentPlan)?.price.toLocaleString()} RWF/month
                      </p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Features included:</p>
                    <ScrollArea className="h-32">
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {plans.find(p => p.name.toLowerCase() === currentPlan)?.features.map((feature, index) => (
                          <li key={index} className="flex items-center">
                            <Check className="h-3 w-3 mr-2 text-green-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                  <Button variant="outline" onClick={() => setIsBillingOpen(true)} className="w-full">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Billing
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Billing History</CardTitle>
                <CardDescription>Recent invoices and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {billingInfo.invoices.map(invoice => (
                    <div key={invoice.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.date}</p>
                        <p className="text-sm text-muted-foreground">{invoice.amount.toLocaleString()} RWF</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{invoice.status}</Badge>
                        <Button variant="outline" size="sm" onClick={() => {
                          const html = `<!DOCTYPE html>
<html>
<head><title>Invoice ${invoice.id}</title></head>
<body style="font-family: Arial; padding: 40px;">
  <h1>INVOICE</h1>
  <p><strong>Date:</strong> ${invoice.date}</p>
  <p><strong>Amount:</strong> ${invoice.amount.toLocaleString()} RWF</p>
  <p><strong>Status:</strong> ${invoice.status}</p>
</body>
</html>`
                          const blob = new Blob([html], { type: 'text/html' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `invoice-${invoice.date}.html`
                          a.click()
                          URL.revokeObjectURL(url)
                        }}>
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <Bell className="mr-2 h-4 w-4 text-orange-500" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when items are low in stock</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Expiry Alerts</p>
                  <p className="text-sm text-muted-foreground">Notifications for expiring medications</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Sales Reports</p>
                  <p className="text-sm text-muted-foreground">Daily and weekly sales summaries</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">System Updates</p>
                  <p className="text-sm text-muted-foreground">Updates about new features and maintenance</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Zap className="mr-2 h-4 w-4 text-blue-500" />
                  API Management
                </CardTitle>
                <CardDescription>Manage API keys and webhooks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {apiKeys.map((api) => (
                    <div key={api.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{api.name}</p>
                        <p className="text-sm text-muted-foreground">{api.key_prefix}...</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={api.is_active ? 'bg-green-100 text-green-800' : ''}>
                          {api.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => {
                          setSelectedApiKey({...api, status: api.is_active ? 'Active' : 'Inactive', key: api.key_hash})
                          setIsEditApiKeyOpen(true)
                        }}>Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full" onClick={() => setIsAddApiKeyOpen(true)}>
                  <Key className="mr-2 h-4 w-4" />
                  Add New API Key
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Webhook className="mr-2 h-4 w-4 text-purple-500" />
                  Connected Services
                </CardTitle>
                <CardDescription>Third-party integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Supplier Integration</p>
                    <p className="text-sm text-muted-foreground">Auto inventory sync</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Insurance Claims</p>
                    <p className="text-sm text-muted-foreground">Real-time claim processing</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Customer alerts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button variant="outline" className="w-full">
                  View Integration Logs
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <BarChart3 className="mr-2 h-4 w-4 text-green-500" />
                  Reports & Analytics
                </CardTitle>
                <CardDescription>Configure reporting preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Daily Sales Reports</p>
                    <p className="text-sm text-muted-foreground">Automated daily summaries</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Inventory Analytics</p>
                    <p className="text-sm text-muted-foreground">Stock movement insights</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="grid gap-2">
                  <Label>Report Frequency</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Monitor className="mr-2 h-4 w-4 text-orange-500" />
                  Performance Monitoring
                </CardTitle>
                <CardDescription>System health and usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">API Response Time</span>
                    <span className="text-sm font-medium">245ms</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Database Performance</span>
                    <span className="text-sm font-medium">Good</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <Button variant="outline" className="w-full">
                  View Detailed Metrics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Shield className="mr-2 h-4 w-4 text-red-500" />
                  Authentication & Access
                </CardTitle>
                <CardDescription>Security and access control</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                  </div>
                  <Switch checked={is2FAEnabled} onCheckedChange={async (checked) => {
                    if (checked) {
                      setIs2FASetupOpen(true)
                    } else {
                      if (confirm('Disable 2FA? This will make your account less secure.')) {
                        const response = await fetch('/api/settings/security/2fa', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ enabled: false })
                        })
                        if (response.ok) {
                          setIs2FAEnabled(false)
                          alert('2FA disabled')
                        }
                      }
                    }
                  }} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SSO Integration</p>
                    <p className="text-sm text-muted-foreground">Single sign-on with SAML/OAuth</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">IP Whitelisting</p>
                    <p className="text-sm text-muted-foreground">Restrict access by IP address</p>
                  </div>
                  <Switch checked={ipWhitelistEnabled} onCheckedChange={toggleIpWhitelist} />
                </div>
                <Button variant="outline" className="w-full" onClick={() => setIsIpWhitelistOpen(true)}>
                  Manage IP Whitelist
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Key className="mr-2 h-4 w-4 text-blue-500" />
                  Data Security
                </CardTitle>
                <CardDescription>Encryption and data protection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Data Encryption</p>
                    <p className="text-sm text-muted-foreground">AES-256 encryption enabled</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">Auto logout after inactivity</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full">
                    Download Security Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <FileText className="mr-2 h-4 w-4 text-purple-500" />
                  Regulatory Compliance
                </CardTitle>
                <CardDescription>GDPR, HIPAA and audit settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">GDPR Compliance</p>
                    <p className="text-sm text-muted-foreground">EU data protection compliance</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Audit Logging</p>
                    <p className="text-sm text-muted-foreground">Track all system activities</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="grid gap-2">
                  <Label>Data Retention Period</Label>
                  <Select defaultValue="7years">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1year">1 Year</SelectItem>
                      <SelectItem value="3years">3 Years</SelectItem>
                      <SelectItem value="7years">7 Years</SelectItem>
                      <SelectItem value="indefinite">Indefinite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Database className="mr-2 h-4 w-4 text-green-500" />
                  Backup & Recovery
                </CardTitle>
                <CardDescription>Data backup and disaster recovery</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Automated Backups</p>
                    <p className="text-sm text-muted-foreground">Daily system backups</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="grid gap-2">
                  <Label>Backup Frequency</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" className="w-full">
                  Download Backup
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Building2 className="mr-2 h-4 w-4 text-blue-500" />
                  Stock Locations
                </CardTitle>
                <CardDescription>Manage warehouse and branch locations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {stockLocations.length > 0 ? (
                    stockLocations.map((location: any) => (
                      <div key={location.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{location.name}</p>
                          <p className="text-sm text-muted-foreground">{location.description}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No locations found. Add your first location.
                    </div>
                  )}
                </div>
                <Button className="w-full" onClick={() => setIsAddLocationOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Location
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Palette className="mr-2 h-4 w-4 text-pink-500" />
                  White-label & Branding
                </CardTitle>
                <CardDescription>Customize appearance and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Company Logo</Label>
                  <div className="flex gap-2">
                    <Input type="file" accept="image/*" className="flex-1" />
                    <Button variant="outline">Upload</Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value="#3b82f6" className="w-16" />
                    <Input value="#3b82f6" className="flex-1" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Custom Domain</Label>
                  <Input placeholder="pharmacy.yourdomain.com" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Clock className="mr-2 h-4 w-4 text-orange-500" />
                  System Operations
                </CardTitle>
                <CardDescription>Maintenance and feature management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">Put system in maintenance</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto Updates</p>
                    <p className="text-sm text-muted-foreground">Automatic system updates</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Feature Flags</p>
                    <p className="text-sm text-muted-foreground">Beta features access</p>
                  </div>
                  <Switch />
                </div>
                <Button variant="outline" className="w-full">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  System Health Check
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isBillingOpen} onOpenChange={setIsBillingOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Billing Management</DialogTitle>
            <DialogDescription>Manage your subscription billing and payment history</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Next Billing</h3>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Due: {billingInfo.nextBilling}</p>
                    <p className="font-semibold">RWF {billingInfo.amount.toLocaleString()}</p>
                  </div>
                  <Button size="sm">Pay Now</Button>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Payment Method</h3>
                <div className="flex justify-between items-center">
                  <p>{billingInfo.paymentMethod}</p>
                  <Button variant="outline" size="sm">Change</Button>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-3">Invoice History</h3>
              <div className="space-y-2">
                {billingInfo.invoices.map(invoice => (
                  <div key={invoice.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <p className="font-medium">{invoice.date}</p>
                      <p className="text-sm text-muted-foreground">RWF {invoice.amount.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">{invoice.status}</Badge>
                      <Button variant="outline" size="sm" onClick={() => {
                        const html = `<!DOCTYPE html>
<html>
<head><title>Invoice ${invoice.id}</title></head>
<body style="font-family: Arial; padding: 40px;">
  <h1>INVOICE</h1>
  <p><strong>Date:</strong> ${invoice.date}</p>
  <p><strong>Amount:</strong> ${invoice.amount.toLocaleString()} RWF</p>
  <p><strong>Status:</strong> ${invoice.status}</p>
</body>
</html>`
                        const blob = new Blob([html], { type: 'text/html' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `invoice-${invoice.date}.html`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}>Download</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddLocationOpen} onOpenChange={setIsAddLocationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Location</DialogTitle>
            <DialogDescription>Create a new stock location for your pharmacy</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Location Name</Label>
              <Input
                placeholder="e.g. Downtown Branch"
                value={newLocation.name}
                onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                placeholder="e.g. City center location"
                value={newLocation.description}
                onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsAddLocationOpen(false)}>Cancel</Button>
            <Button onClick={handleAddLocation} disabled={!newLocation.name}>
              Add Location
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddApiKeyOpen} onOpenChange={setIsAddApiKeyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New API Key</DialogTitle>
            <DialogDescription>Add a new API integration key</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>API Name</Label>
              <Input
                placeholder="e.g. Payment Gateway"
                value={newApiKey.name}
                onChange={(e) => setNewApiKey({...newApiKey, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label>API Key</Label>
              <Input
                placeholder="Enter API key"
                value={newApiKey.key}
                onChange={(e) => setNewApiKey({...newApiKey, key: e.target.value})}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => {
              setIsAddApiKeyOpen(false)
              setNewApiKey({ name: '', key: '' })
            }}>Cancel</Button>
            <Button onClick={async () => {
              if (newApiKey.name && newApiKey.key) {
                try {
                  const response = await fetch('/api/settings/api-keys', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newApiKey)
                  })
                  const result = await response.json()
                  if (response.ok && result.success) {
                    await fetchApiKeys()
                    setIsAddApiKeyOpen(false)
                    setNewApiKey({ name: '', key: '' })
                    alert('API Key added successfully!')
                  } else {
                    console.error('API Error:', result)
                    alert(result.error || 'Failed to add API key. Please check console for details.')
                  }
                } catch (error) {
                  console.error('Error adding API key:', error)
                  alert('Network error: Failed to add API key. Please try again.')
                }
              }
            }} disabled={!newApiKey.name || !newApiKey.key}>
              Add API Key
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditApiKeyOpen} onOpenChange={setIsEditApiKeyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit API Key</DialogTitle>
            <DialogDescription>Update API integration settings</DialogDescription>
          </DialogHeader>
          {selectedApiKey && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>API Name</Label>
                <Input
                  value={selectedApiKey.name}
                  onChange={(e) => setSelectedApiKey({...selectedApiKey, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>API Key</Label>
                <Input
                  value={selectedApiKey.key}
                  onChange={(e) => setSelectedApiKey({...selectedApiKey, key: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={selectedApiKey.status} onValueChange={(value) => setSelectedApiKey({...selectedApiKey, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsEditApiKeyOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                const response = await fetch('/api/settings/api-keys', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(selectedApiKey)
                })
                const result = await response.json()
                if (response.ok && result.success) {
                  await fetchApiKeys()
                  setIsEditApiKeyOpen(false)
                  alert('API Key updated successfully!')
                } else {
                  alert(result.error || 'Failed to update API key')
                }
              } catch (error) {
                console.error('Error updating API key:', error)
                alert('Failed to update API key')
              }
            }}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isIpWhitelistOpen} onOpenChange={setIsIpWhitelistOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage IP Whitelist</DialogTitle>
            <DialogDescription>Add or remove IP addresses allowed to access your system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="IP Address (e.g. 192.168.1.100)"
                value={newIp.ip}
                onChange={(e) => setNewIp({...newIp, ip: e.target.value})}
              />
              <Input
                placeholder="Description"
                value={newIp.description}
                onChange={(e) => setNewIp({...newIp, description: e.target.value})}
              />
            </div>
            <Button onClick={async () => {
              if (newIp.ip) {
                try {
                  const response = await fetch('/api/settings/security/ip-whitelist/manage', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newIp)
                  })
                  const result = await response.json()
                  if (response.ok && result.success) {
                    setNewIp({ ip: '', description: '' })
                    await fetchIpWhitelist()
                    alert('IP added successfully!')
                  } else {
                    alert(result.error || 'Failed to add IP')
                  }
                } catch (error) {
                  console.error('Error adding IP:', error)
                  alert('Failed to add IP')
                }
              }
            }} disabled={!newIp.ip}>
              <Plus className="mr-2 h-4 w-4" />
              Add IP Address
            </Button>
            <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
              {ipWhitelist.length > 0 ? (
                <div className="space-y-2">
                  {ipWhitelist.map((ip: any) => (
                    <div key={ip.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{ip.ip_address}</p>
                        <p className="text-xs text-muted-foreground">{ip.description}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={async () => {
                        try {
                          const response = await fetch('/api/settings/security/ip-whitelist/manage', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: ip.id })
                          })
                          if (response.ok) {
                            await fetchIpWhitelist()
                            alert('IP removed successfully!')
                          }
                        } catch (error) {
                          console.error('Error removing IP:', error)
                        }
                      }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">No whitelisted IPs yet</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={is2FASetupOpen} onOpenChange={setIs2FASetupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {setupStep === 'qr' && 'Scan the QR code with your authenticator app'}
              {setupStep === 'verify' && 'Enter the code from your authenticator app'}
              {setupStep === 'backup' && 'Save these backup codes in a safe place'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {setupStep === 'qr' && (
              <>
                {qrCode ? (
                  <div className="flex flex-col items-center space-y-4">
                    <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                    <p className="text-xs text-muted-foreground text-center">
                      Scan this with Google Authenticator, Authy, or similar app
                    </p>
                    <Button onClick={() => setSetupStep('verify')} className="w-full">
                      Next
                    </Button>
                  </div>
                ) : (
                  <Button onClick={async () => {
                    try {
                      const response = await fetch('/api/settings/security/2fa/setup', { method: 'POST' })
                      const data = await response.json()
                      if (response.ok) {
                        setQrCode(data.qrCode)
                        setBackupCodes(data.backupCodes)
                      } else {
                        alert(data.error || 'Failed to generate QR code')
                      }
                    } catch (err) {
                      alert('Failed to generate QR code')
                    }
                  }} className="w-full">
                    Generate QR Code
                  </Button>
                )}
              </>
            )}
            {setupStep === 'verify' && (
              <>
                <div className="space-y-2">
                  <Label>Enter 6-digit code</Label>
                  <Input
                    placeholder="000000"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    autoFocus
                  />
                </div>
                <Button onClick={async () => {
                  try {
                    const response = await fetch('/api/settings/security/2fa/verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token: verifyCode })
                    })
                    if (response.ok) {
                      setSetupStep('backup')
                    } else {
                      const data = await response.json()
                      alert(data.error || 'Invalid code')
                    }
                  } catch (err) {
                    alert('Verification failed')
                  }
                }} disabled={verifyCode.length !== 6} className="w-full">
                  Verify
                </Button>
              </>
            )}
            {setupStep === 'backup' && (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <p className="text-sm font-medium mb-2">Backup Codes</p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    {backupCodes.map((code, i) => (
                      <div key={i} className="bg-white p-2 rounded">{code}</div>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Save these codes. Each can be used once if you lose access to your authenticator.
                </p>
                <Button onClick={() => {
                  setIs2FAEnabled(true)
                  setIs2FASetupOpen(false)
                  setSetupStep('qr')
                  setQrCode('')
                  setVerifyCode('')
                  alert('2FA enabled successfully!')
                }} className="w-full">
                  Done
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Subscription Plans</CardTitle>
          <CardDescription>Choose the plan that fits your pharmacy needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className={`border rounded-lg p-6 ${plan.current ? 'border-blue-500 bg-blue-50' : ''}`}>
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <div className="text-3xl font-bold text-blue-600">{plan.price.toLocaleString()} RWF</div>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
                <ScrollArea className="h-32 mb-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <Check className="h-3 w-3 mr-2 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
                {plan.current ? (
                  <Button disabled className="w-full">
                    <Check className="mr-2 h-4 w-4" />
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleUpgrade(plan.name)}
                    variant={plan.name === 'Premium' ? 'default' : 'outline'}
                    className="w-full"
                  >
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    {plan.price > (plans.find(p => p.current)?.price || 0) ? 'Upgrade' : 'Downgrade'}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}