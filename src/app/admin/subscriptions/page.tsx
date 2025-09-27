'use client'

import { useState, useEffect } from 'react'
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Plus, Edit, Crown, CheckCircle } from "lucide-react";

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<any[]>([])

  const [isAddingPlan, setIsAddingPlan] = useState(false)
  const [isEditingPlan, setIsEditingPlan] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: '',
    period: 'per month',
    features: ''
  })

  const chartData = plans.map(plan => ({
    plan: plan.name,
    subscribers: plan.users || 0,
    width: Math.max(20, (plan.users || 0) * 5)
  }))

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/admin/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.map((plan: any) => ({
          ...plan,
          users: 0, // TODO: Get actual subscriber count
          popular: plan.is_popular
        })))
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleAddPlan = async () => {
    try {
      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlan,
          price: parseInt(newPlan.price),
          features: newPlan.features.split(',').map(f => f.trim())
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        await fetchPlans()
        setIsAddingPlan(false)
        setNewPlan({ name: '', price: '', period: 'per month', features: '' })
        alert('Plan added successfully!')
      } else {
        console.error('API Error:', result)
        alert(`Error: ${result.error || 'Failed to add plan'}`)
      }
    } catch (error) {
      console.error('Error adding plan:', error)
      alert('Network error occurred')
    }
  }

  const handleEditPlan = async () => {
    try {
      const response = await fetch(`/api/admin/plans/${selectedPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedPlan,
          is_popular: selectedPlan.popular
        })
      })
      
      if (response.ok) {
        await fetchPlans()
        setIsEditingPlan(false)
        setSelectedPlan(null)
        alert('Plan updated successfully!')
      }
    } catch (error) {
      console.error('Error updating plan:', error)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-blue-600" />
              Subscription Plans
            </h1>
            <p className="text-gray-600">Manage pricing and subscription plans</p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Subscription Analytics</CardTitle>
              <CardDescription>Current subscribers by plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartData.map((data, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-20 text-sm font-medium">{data.plan}</div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded h-0.5">
                        <div 
                          className="bg-gray-800 h-0.5 rounded transition-all duration-500"
                          style={{ width: `${data.width}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-xs font-medium">{data.subscribers}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-2 border-gray-800' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gray-800 text-white px-3 py-1">
                      <Crown className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold">
                    RWF {plan.price.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.users} active subscribers</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline" onClick={() => {
                      setSelectedPlan(plan)
                      setIsEditingPlan(true)
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Plan Management</CardTitle>
                  <CardDescription>Create and manage subscription plans</CardDescription>
                </div>
                <Dialog open={isAddingPlan} onOpenChange={setIsAddingPlan}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Plan</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label>Plan Name</Label>
                        <Input
                          value={newPlan.name}
                          onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Price (RWF)</Label>
                        <Input
                          type="number"
                          value={newPlan.price}
                          onChange={(e) => setNewPlan({...newPlan, price: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Features (comma separated)</Label>
                        <Textarea
                          value={newPlan.features}
                          onChange={(e) => setNewPlan({...newPlan, features: e.target.value})}
                          placeholder="Feature 1, Feature 2, Feature 3"
                        />
                      </div>
                      <Button onClick={handleAddPlan} disabled={!newPlan.name || !newPlan.price}>
                        Add Plan
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
          </Card>

          {/* Edit Dialog */}
          <Dialog open={isEditingPlan} onOpenChange={setIsEditingPlan}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Plan</DialogTitle>
              </DialogHeader>
              {selectedPlan && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Plan Name</Label>
                    <Input
                      value={selectedPlan.name}
                      onChange={(e) => setSelectedPlan({...selectedPlan, name: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Price (RWF)</Label>
                    <Input
                      type="number"
                      value={selectedPlan.price}
                      onChange={(e) => setSelectedPlan({...selectedPlan, price: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Features (comma separated)</Label>
                    <Textarea
                      value={selectedPlan.features.join(', ')}
                      onChange={(e) => setSelectedPlan({...selectedPlan, features: e.target.value.split(',').map(f => f.trim())})}
                    />
                  </div>
                  <Button onClick={handleEditPlan}>Save Changes</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}