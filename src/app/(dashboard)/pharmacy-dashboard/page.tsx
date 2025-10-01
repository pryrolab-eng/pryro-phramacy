'use client'

import { useState, useEffect } from 'react'
import { usePharmacyStore } from '@/hooks/usePharmacyStore'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, DollarSign, Users, AlertTriangle, TrendingUp, ShoppingCart, Calendar, Clock, Pill } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Area, AreaChart, BarChart, Bar, XAxis, CartesianGrid, LabelList, YAxis } from 'recharts'
import { PharmacyRadialChart } from '@/components/pharmacy-radial-chart'
import { PharmacyBarChart } from '@/components/pharmacy-bar-chart'
import { PharmacyInventoryChart } from '@/components/pharmacy-inventory-chart'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

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
  const { inventory, sales, alerts, stats, setInventory, addSale, setAlerts, setStats } = usePharmacyStore()
  const [localStats, setLocalStats] = useState<PharmacyStats>({
    totalProducts: 1250,
    lowStockItems: 23,
    todaySales: 145000,
    monthlyRevenue: 3200000,
    totalCustomers: 890,
    activeStaff: 8,
    pendingOrders: 12,
    expiringProducts: 15
  })

  // Real-time updates
  useRealtimeUpdates((update) => {
    if (update.type === 'inventory_update') {
      fetchStockAlerts()
    }
    if (update.type === 'new_sale') {
      fetchStats()
      fetchRecentSales()
    }
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/pharmacy/dashboard')
        if (response.ok) {
          const data = await response.json()
          setLocalStats(data)
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
        const response = await fetch('/api/stock-alerts')
        if (response.ok) {
          const data = await response.json()
          setStockAlerts(data.all || [])
          setLowStockItems(data.lowStock || [])
          setExpiringItems(data.expiring || [])
          setAlerts(data.all || [])
        }
      } catch (error) {
        const mockData = [
          { id: '1', product: 'Paracetamol 500mg', current_stock: 5, min_stock: 20, category: 'Pain Relief', expires_in: 30 },
          { id: '2', product: 'Amoxicillin 250mg', current_stock: 8, min_stock: 25, category: 'Antibiotics', expires_in: 15 }
        ]
        setStockAlerts(mockData)
        setLowStockItems(mockData.filter(item => item.current_stock <= item.min_stock))
        setExpiringItems(mockData.filter(item => item.expires_in <= 60))
        setAlerts(mockData)
      }
    }
    
    fetchStats()
    fetchRecentSales()
    fetchStockAlerts()
  }, [])

  const handleAddPharmacist = async () => {
    try {
      const credentials = {
        email: newPharmacist.email,
        password: newPharmacist.password,
        name: newPharmacist.name
      }
      
      const response = await fetch('/api/pharmacist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newPharmacist.email,
          password: newPharmacist.password,
          full_name: newPharmacist.name,
          phone: newPharmacist.phone,
          role: 'pharmacist',
          pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setIsAddingPharmacist(false)
        setNewPharmacist({ name: '', email: '', phone: '', password: '' })
        alert(`✅ Pharmacist Created Successfully!\n\n📧 SHARE THESE LOGIN CREDENTIALS:\n\nEmail: ${credentials.email}\nPassword: ${credentials.password}\n\n🔐 ${credentials.name} can now login and access the pharmacist dashboard.`)
      } else {
        console.error('API Error:', result)
        alert(`❌ Failed: ${result.error}\n\nDetails: ${result.details || 'None'}\n\nAuth Error: ${result.authError || 'None'}`)
      }
    } catch (error) {
      console.error('Error adding pharmacist:', error)
      alert('Error adding pharmacist')
    }
  }

  const [recentSales, setRecentSales] = useState<RecentSale[]>([])

  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [lowStockItems, setLowStockItems] = useState<StockAlert[]>([])
  const [expiringItems, setExpiringItems] = useState<StockAlert[]>([])
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
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-3xl font-bold">Pharmacy Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your pharmacy overview</p>
          </div>
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

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localStats.todaySales.toLocaleString()} RWF</div>

            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localStats.totalProducts}</div>

            <p className="text-xs text-muted-foreground">{localStats.lowStockItems} low stock</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localStats.totalCustomers}</div>

            <p className="text-xs text-muted-foreground">{localStats.activeStaff} active staff</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>

            <p className="text-xs text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringItems.length}</div>

            <p className="text-xs text-muted-foreground">Within 60 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-lg">
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

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
              Low Stock Items
            </CardTitle>
            <CardDescription>Products below minimum threshold</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {lowStockItems.map((alert) => (
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
                      {alert.current_stock} / {alert.min_stock}
                    </Badge>
                    <p className="text-xs text-muted-foreground">Reorder needed</p>
                  </div>
                </div>
              ))}
              {lowStockItems.length === 0 && (
                <p className="text-center text-muted-foreground py-4">All items adequately stocked</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-red-500" />
              Expiring Soon
            </CardTitle>
            <CardDescription>Products expiring within 60 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {expiringItems.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">{alert.product}</p>
                      <p className="text-sm text-muted-foreground">{alert.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={alert.expires_in <= 30 ? 'destructive' : 'secondary'} className="mb-1">
                      {alert.expires_in} days
                    </Badge>
                    <p className="text-xs text-muted-foreground">Stock: {alert.current_stock}</p>
                  </div>
                </div>
              ))}
              {expiringItems.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No items expiring soon</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-lg md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Performance</CardTitle>
            <CardDescription>January - June 2024</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{
              revenue: { label: "Revenue", color: "#3b82f6" },
              label: { color: "var(--background)" }
            }}>
              <BarChart
                accessibilityLayer
                data={[
                  { month: "January", revenue: 186000 },
                  { month: "February", revenue: 305000 },
                  { month: "March", revenue: 237000 },
                  { month: "April", revenue: 173000 },
                  { month: "May", revenue: 209000 },
                  { month: "June", revenue: 214000 }
                ]}
                layout="vertical"
                margin={{ right: 16 }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="month"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                  hide
                />
                <XAxis dataKey="revenue" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <Bar
                  dataKey="revenue"
                  layout="vertical"
                  fill="#3b82f6"
                  radius={4}
                >
                  <LabelList
                    dataKey="month"
                    position="insideLeft"
                    offset={8}
                    className="fill-white"
                    fontSize={12}
                  />
                  <LabelList
                    dataKey="revenue"
                    position="right"
                    offset={8}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <PharmacyRadialChart />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <PharmacyBarChart />
        <PharmacyInventoryChart />
      </div>
    </div>
  )
}