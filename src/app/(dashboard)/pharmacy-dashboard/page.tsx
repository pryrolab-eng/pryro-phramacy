'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePharmacyStore } from '@/hooks/usePharmacyStore'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { createClient } from '../../../../supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Spinner } from '@/components/ui/spinner'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Package, DollarSign, Users, AlertTriangle, TrendingUp, ShoppingCart, Calendar, Clock, Pill, Activity, Eye, MoreHorizontal, ArrowUpRight, ArrowDownRight } from 'lucide-react'
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
  const router = useRouter()
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
    
    const fetchSalesChart = async () => {
      try {
        const response = await fetch('/api/pharmacy/sales-chart')
        if (response.ok) {
          const data = await response.json()
          setSalesChartData(data)
        }
      } catch (error) {
        console.error('Error fetching sales chart:', error)
      }
    }
    
    fetchStats()
    fetchRecentSales()
    fetchStockAlerts()
    fetchSalesChart()
  }, [])

  const handleAddPharmacist = async () => {
    try {
      const credentials = {
        email: newPharmacist.email,
        password: newPharmacist.password,
        name: newPharmacist.name
      }
      
      // Get auth token from Supabase client
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        alert('Please login first')
        return
      }
      
      // Get current user's pharmacy_id from pharmacy_users table
      const { data: currentUser } = await supabase
        .from('pharmacy_users')
        .select('pharmacy_id')
        .eq('user_id', session.user.id)
        .single()
      
      const response = await fetch('/api/pharmacist', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email: newPharmacist.email,
          password: newPharmacist.password,
          full_name: newPharmacist.name,
          phone: newPharmacist.phone,
          role: 'pharmacist',
          pharmacy_id: currentUser?.pharmacy_id
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
  const [loading, setLoading] = useState(false)
  const [salesChartData, setSalesChartData] = useState([])

  const SalesChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Sales Performance</CardTitle>
        <CardDescription>Monthly revenue trends</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{
          revenue: { label: "Revenue", color: "hsl(var(--chart-1))" }
        }}>
          <AreaChart data={salesChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.2} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Pharmacy Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              Welcome back! Here's your pharmacy overview for today.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Calendar className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Dialog open={isAddingPharmacist} onOpenChange={setIsAddingPharmacist}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Pill className="mr-2 h-4 w-4" />
                Add Pharmacist
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Pharmacist</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newPharmacist.name}
                    onChange={(e) => setNewPharmacist({...newPharmacist, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPharmacist.email}
                    onChange={(e) => setNewPharmacist({...newPharmacist, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newPharmacist.phone}
                    onChange={(e) => setNewPharmacist({...newPharmacist, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    value={newPharmacist.password}
                    onChange={(e) => setNewPharmacist({...newPharmacist, password: e.target.value})}
                    placeholder="Minimum 8 characters"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  onClick={handleAddPharmacist} 
                  disabled={!newPharmacist.name || !newPharmacist.email || !newPharmacist.password}
                  className="w-full"
                >
                  Add Pharmacist
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={() => window.location.href = '/pos'} size="sm">
            <ShoppingCart className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localStats.todaySales.toLocaleString()} RWF</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              +12% from yesterday
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localStats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">{localStats.lowStockItems} low stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{localStats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">{localStats.activeStaff} active staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringItems.length}</div>
            <p className="text-xs text-muted-foreground">Within 60 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Recent Sales */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Sales</CardTitle>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {recentSales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-green-100 text-green-600">
                              {sale.customer.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{sale.customer}</p>
                            <p className="text-xs text-muted-foreground">{sale.items} items • {sale.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{sale.amount.toLocaleString()} RWF</p>
                          <Badge variant={sale.payment_method === 'Insurance' ? 'secondary' : 'outline'} className="text-xs">
                            {sale.payment_method}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Low Stock Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
                <Badge variant="destructive" className="text-xs">
                  {lowStockItems.length}
                </Badge>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {lowStockItems.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <Package className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{alert.product}</p>
                            <p className="text-xs text-muted-foreground">{alert.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-amber-700">
                            {alert.current_stock} / {alert.min_stock}
                          </div>
                          <Progress value={(alert.current_stock / alert.min_stock) * 100} className="w-16 h-2 mt-1" />
                        </div>
                      </div>
                    ))}
                    {lowStockItems.length === 0 && (
                      <div className="text-center py-8">
                        <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">All items adequately stocked</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Expiring Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {expiringItems.length}
                </Badge>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {expiringItems.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{alert.product}</p>
                            <p className="text-xs text-muted-foreground">{alert.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={alert.expires_in <= 30 ? 'destructive' : 'secondary'} className="text-xs">
                            {alert.expires_in} days
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">Stock: {alert.current_stock}</p>
                        </div>
                      </div>
                    ))}
                    {expiringItems.length === 0 && (
                      <div className="text-center py-8">
                        <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No items expiring soon</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SalesChart />
            <PharmacyRadialChart />
          </div>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <PharmacyBarChart />
            <PharmacyInventoryChart />
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Monthly Performance</CardTitle>
              <CardDescription>Revenue trends from database</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                revenue: { label: "Revenue", color: "hsl(var(--chart-1))" }
              }}>
                <BarChart
                  data={salesChartData.map(item => ({ month: item.month, revenue: item.revenue }))}
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
                    hide
                  />
                  <XAxis dataKey="revenue" type="number" hide />
                  <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                  <Bar dataKey="revenue" layout="vertical" fill="hsl(var(--chart-1))" radius={4}>
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
        </TabsContent>
      </Tabs>


    </div>
  )
}