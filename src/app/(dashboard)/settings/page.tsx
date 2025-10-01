'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Settings, CreditCard, Users, Building2, Check, Globe, DollarSign } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'

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

  const [plans, setPlans] = useState<SubscriptionPlan[]>([])

  useEffect(() => {
    fetchPharmacyInfo()
    fetchPlans()
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

  const handleUpgrade = (planName: string) => {
    setCurrentPlan(planName.toLowerCase())
    alert(`Upgraded to ${planName} plan!`)
  }

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="h-4 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your pharmacy settings and subscription</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5" />
              Pharmacy Information
            </CardTitle>
            <CardDescription>Your pharmacy details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">Name</p>
              <p className="text-muted-foreground">{pharmacyInfo.name}</p>
            </div>
            <div>
              <p className="font-medium">License Number</p>
              <p className="text-muted-foreground">{pharmacyInfo.license}</p>
            </div>
            <div>
              <p className="font-medium">Location</p>
              <p className="text-muted-foreground">{pharmacyInfo.location}</p>
            </div>
            <div>
              <p className="font-medium">Phone</p>
              <p className="text-muted-foreground">{pharmacyInfo.phone}</p>
            </div>
            <div>
              <p className="font-medium">Email</p>
              <p className="text-muted-foreground">{pharmacyInfo.email}</p>
            </div>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Information</Button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <input
                    className="w-full p-2 border rounded mt-1"
                    value={editInfo.name}
                    onChange={(e) => setEditInfo({...editInfo, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <input
                    className="w-full p-2 border rounded mt-1"
                    value={editInfo.location}
                    onChange={(e) => setEditInfo({...editInfo, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <input
                    className="w-full p-2 border rounded mt-1"
                    value={editInfo.phone}
                    onChange={(e) => setEditInfo({...editInfo, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    className="w-full p-2 border rounded mt-1"
                    value={editInfo.email}
                    onChange={(e) => setEditInfo({...editInfo, email: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit}>Save</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="mr-2 h-5 w-5" />
              System Preferences
            </CardTitle>
            <CardDescription>Currency and language settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Currency</label>
              <select
                className="w-full p-2 border rounded mt-1"
                value={editInfo.currency}
                onChange={(e) => setEditInfo({...editInfo, currency: e.target.value})}
              >
                <option value="RWF">Rwandan Franc (RWF)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="KES">Kenyan Shilling (KES)</option>
                <option value="UGX">Ugandan Shilling (UGX)</option>
                <option value="TZS">Tanzanian Shilling (TZS)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Language</label>
              <select
                className="w-full p-2 border rounded mt-1"
                value={editInfo.language}
                onChange={(e) => setEditInfo({...editInfo, language: e.target.value})}
              >
                <option value="en">English</option>
                <option value="rw">Kinyarwanda</option>
                <option value="fr">Français</option>
                <option value="sw">Kiswahili</option>
              </select>
            </div>
            <Button onClick={handleSaveEdit} className="w-full">
              Save Preferences
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Current Subscription
            </CardTitle>
            <CardDescription>Your current plan details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize">{currentPlan} Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {plans.find(p => p.name.toLowerCase() === currentPlan)?.price.toLocaleString()} RWF/month
                  </p>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Features included:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {plans.find(p => p.name.toLowerCase() === currentPlan)?.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-3 w-3 mr-2 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Button variant="outline" onClick={() => setIsBillingOpen(true)}>Manage Billing</Button>
            </div>
          </CardContent>
        </Card>
      </div>

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
                      <Button variant="outline" size="sm">Download</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Choose the plan that fits your pharmacy needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.name} className={`border rounded-lg p-4 ${plan.current ? 'border-blue-500 bg-blue-50' : ''}`}>
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <div className="text-2xl font-bold">{plan.price.toLocaleString()} RWF</div>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="h-3 w-3 mr-2 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.current ? (
                  <Button disabled className="w-full">Current Plan</Button>
                ) : (
                  <Button 
                    onClick={() => handleUpgrade(plan.name)}
                    variant={plan.name === 'Premium' ? 'default' : 'outline'}
                    className="w-full"
                  >
                    {plan.price > plans.find(p => p.current)?.price! ? 'Upgrade' : 'Downgrade'}
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