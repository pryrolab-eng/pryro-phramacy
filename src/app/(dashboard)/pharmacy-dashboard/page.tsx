'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, DollarSign, Users, AlertTriangle, TrendingUp, ShoppingCart, Calendar, Clock, Pill } from 'lucide-react'

interface PharmacyStats {
  totalProducts: number
  lowStockItems: number
  todaySales: number
  monthlyRevenue: number
  totalCustomers: number
  activeStaff: number
  pendingOrders: number
  expiringProducts: number
}

interface RecentSale {
  id: string
  customer: string
  amount: number
  items: number
  time: string
  payment_method: string
}

interface StockAlert {
  id: string
  product: string
  current_stock: number
  min_stock: number
  category: string
  expires_in: number
}

export default function PharmacyDashboard() {
  const [stats, setStats] = useState<PharmacyStats>({
    totalProducts: 1250,
    lowStockItems: 23,
    todaySales: 145000,
    monthlyRevenue: 3200000,
    totalCustomers: 890,
    activeStaff: 8,
    pendingOrders: 12,
    expiringProducts: 15
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/pharmacy/dashboard')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }
    
    const fetchRecentSales = async () => {
      try {
        const response = await fetch('/api/pos')
        if (response.ok) {
          const data = await response.json()
          setRecentSales(data)
        }
      } catch (error) {
        console.error('Error fetching recent sales:', error)
      }
    }
    
    const fetchStockAlerts = async () => {
      try {
        const response = await fetch('/api/alerts')
        if (response.ok) {
          const data = await response.json()
          setStockAlerts(data)
        }
      } catch (error) {
        console.error('Error fetching stock alerts:', error)
      }
    }
    
    fetchStats()
    fetchRecentSales()
    fetchStockAlerts()
  }, [])

  const handleAddPharmacist = async () => {
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newPharmacist.email,
          password: newPharmacist.password,
          full_name: newPharmacist.name,
          phone: newPharmacist.phone,
          role: 'pharmacist'
        })
      })
      
      if (response.ok) {
        setIsAddingPharmacist(false)
        setNewPharmacist({ name: '', email: '', phone: '', password: '' })
        alert('Pharmacist added successfully!')
      } else {
        alert('Failed to add pharmacist')
      }
    } catch (error) {
      console.error('Error adding pharmacist:', error)
      alert('Error adding pharmacist')
    }
  }

  const [recentSales, setRecentSales] = useState<RecentSale[]>([])

  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [isAddingPharmacist, setIsAddingPharmacist] = useState(false)
  const [newPharmacist, setNewPharmacist] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  })

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen ml-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pharmacy Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your pharmacy overview</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Calendar className="mr-2 h-4 w-4" />
            Today's Report
          </Button>
          <Dialog open={isAddingPharmacist} onOpenChange={setIsAddingPharmacist}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Pill className="mr-2 h-4 w-4" />
                Add Pharmacist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Pharmacist</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Full Name</Label>
                  <Input
                    value={newPharmacist.name}
                    onChange={(e) => setNewPharmacist({...newPharmacist, name: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newPharmacist.email}
                    onChange={(e) => setNewPharmacist({...newPharmacist, email: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input
                    value={newPharmacist.phone}
                    onChange={(e) => setNewPharmacist({...newPharmacist, phone: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newPharmacist.password}
                    onChange={(e) => setNewPharmacist({...newPharmacist, password: e.target.value})}
                    placeholder="Minimum 8 characters"
                  />
                </div>
                <Button onClick={handleAddPharmacist} disabled={!newPharmacist.name || !newPharmacist.email || !newPharmacist.password}>
                  Add Pharmacist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => window.location.href = '/pos'}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todaySales.toLocaleString()} RWF</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">{stats.lowStockItems} low stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeStaff} active staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockItems + stats.expiringProducts}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Recent Sales
            </CardTitle>
            <CardDescription>Latest transactions today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{sale.customer}</p>
                      <p className="text-sm text-muted-foreground">{sale.items} items • {sale.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{sale.amount.toLocaleString()} RWF</p>
                    <Badge variant={sale.payment_method === 'Insurance' ? 'secondary' : 'outline'} className="text-xs">
                      {sale.payment_method}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
              Stock Alerts
            </CardTitle>
            <CardDescription>Products requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stockAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <Package className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">{alert.product}</p>
                      <p className="text-sm text-muted-foreground">{alert.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive" className="mb-1">
                      {alert.current_stock} left
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {alert.expires_in}d to expire
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
          <CardDescription>Revenue and sales overview for this month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.monthlyRevenue.toLocaleString()} RWF</div>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.pendingOrders}</div>
              <p className="text-sm text-muted-foreground">Pending Orders</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">85%</div>
              <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}