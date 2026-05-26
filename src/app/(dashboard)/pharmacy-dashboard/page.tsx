'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import {
  useInvalidatePharmacyDashboard,
  usePharmacyDashboardStats,
  usePharmacySalesChart,
  useRecentPosSales,
  useStockAlerts,
  useCreatePharmacistMutation,
  type PharmacyDashboardStats,
} from '@/hooks'
import { toast } from 'sonner'
import { createClient } from '../../../../supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"
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
import { Package, DollarSign, Users, AlertTriangle, ShoppingCart, Calendar, Clock, Pill, Eye } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Area, AreaChart, BarChart, Bar, XAxis, CartesianGrid, LabelList, YAxis } from 'recharts'
import { PharmacyRadialChart } from '@/components/pharmacy-radial-chart'
import { PharmacyBarChart } from '@/components/pharmacy-bar-chart'
import { PharmacyInventoryChart } from '@/components/pharmacy-inventory-chart'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BranchUsageWidget } from '@/components/branch-usage-widget'
import { DashboardPanelEmpty } from '@/components/dashboard/dashboard-panel-empty'
import { DashboardPanelSkeleton } from '@/components/dashboard/dashboard-panel-skeleton'
import { Skeleton } from '@/components/ui/skeleton'

const EMPTY_STATS: PharmacyDashboardStats = {
  totalProducts: 0,
  lowStockItems: 0,
  todaySales: 0,
  monthlyRevenue: 0,
  totalCustomers: 0,
  activeStaff: 0,
  pendingOrders: 0,
  expiringProducts: 0,
}

export default function PharmacyDashboard() {
  const statsQuery = usePharmacyDashboardStats()
  const recentSalesQuery = useRecentPosSales()
  const stockAlertsQuery = useStockAlerts()
  const salesChartQuery = usePharmacySalesChart()
  const { invalidateStats, invalidateRecentSales, invalidateStockAlerts } =
    useInvalidatePharmacyDashboard()

  const localStats = statsQuery.data ?? EMPTY_STATS
  const recentSales = recentSalesQuery.data ?? []
  const lowStockItems = stockAlertsQuery.data?.lowStock ?? []
  const expiringItems = stockAlertsQuery.data?.expiring ?? []
  const salesChartData = salesChartQuery.data ?? []

  const overviewLoading =
    statsQuery.isPending ||
    recentSalesQuery.isPending ||
    stockAlertsQuery.isPending ||
    salesChartQuery.isPending

  useRealtimeUpdates((update) => {
    if (update.type === 'inventory_update') {
      void invalidateStockAlerts()
    }
    if (update.type === 'new_sale') {
      void invalidateStats()
      void invalidateRecentSales()
    }
  })

  const [isAddingPharmacist, setIsAddingPharmacist] = useState(false)
  const [newPharmacist, setNewPharmacist] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  })

  const createPharmacistMutation = useCreatePharmacistMutation()

  const handleAddPharmacist = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      toast.error('Please sign in first')
      return
    }

    const { data: currentUser } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id, pharmacies(name)')
      .eq('user_id', session.user.id)
      .single()

    if (!currentUser?.pharmacy_id) {
      toast.error('Pharmacy not found')
      return
    }

    const pharmacyJoin = currentUser.pharmacies as
      | { name?: string }
      | { name?: string }[]
      | null
    const pharmacyName = Array.isArray(pharmacyJoin)
      ? pharmacyJoin[0]?.name
      : pharmacyJoin?.name

    try {
      const invitedEmail = newPharmacist.email
      const result = await createPharmacistMutation.mutateAsync({
        email: invitedEmail,
        password: newPharmacist.password,
        full_name: newPharmacist.name,
        phone: newPharmacist.phone,
        role: 'pharmacist',
        pharmacy_id: currentUser.pharmacy_id,
        pharmacy_name: pharmacyName,
      })

      setIsAddingPharmacist(false)
      setNewPharmacist({ name: '', email: '', phone: '', password: '' })

      if (result.emailSent) {
        toast.success('Invitation sent', {
          description: `Login instructions were emailed to ${invitedEmail}.`,
        })
      } else {
        toast.warning('Pharmacist created', {
          description:
            result.emailError ??
            'Account created but the invitation email could not be sent.',
        })
      }
    } catch (error) {
      toast.error('Could not add pharmacist', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

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
                  onClick={() => void handleAddPharmacist()}
                  disabled={
                    !newPharmacist.name ||
                    !newPharmacist.email ||
                    !newPharmacist.password ||
                    createPharmacistMutation.isPending
                  }
                  className="w-full"
                >
                  {createPharmacistMutation.isPending ? 'Sending…' : 'Add Pharmacist'}
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
            {overviewLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold">
                {localStats.todaySales.toLocaleString()} RWF
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {overviewLoading
                ? 'Loading…'
                : localStats.todaySales === 0
                  ? 'No sales recorded today'
                  : 'Total for today'}
            </p>
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
            {overviewLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{localStats.totalProducts}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {overviewLoading ? 'Loading…' : `${lowStockItems.length} low stock`}
            </p>
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
            {overviewLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{localStats.totalCustomers}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {overviewLoading ? 'Loading…' : 'Unique customers'}
            </p>
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
            {overviewLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{lowStockItems.length}</div>
            )}
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
            {overviewLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{expiringItems.length}</div>
            )}
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
          {/* Subscription & branch usage widget */}
          <BranchUsageWidget />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Recent Sales */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Sales</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/sales" aria-label="View all sales">
                    <Eye className="h-4 w-4" />
                  </a>
                </Button>
              </CardHeader>
              <CardContent>
                {overviewLoading ? (
                  <DashboardPanelSkeleton rows={4} />
                ) : recentSales.length === 0 ? (
                  <DashboardPanelEmpty
                    icon={ShoppingCart}
                    title="No sales yet"
                    description="Your latest transactions will show up here after you complete a sale at the POS."
                    actionLabel="Open POS"
                    actionHref="/pos"
                  />
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {recentSales.map((sale) => (
                        <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-neutral-100 text-neutral-700">
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
                )}
              </CardContent>
            </Card>

            {/* Low Stock Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
                <Badge
                  variant={lowStockItems.length > 0 ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {overviewLoading ? '…' : lowStockItems.length}
                </Badge>
              </CardHeader>
              <CardContent>
                {overviewLoading ? (
                  <DashboardPanelSkeleton rows={4} />
                ) : lowStockItems.length === 0 ? (
                  <DashboardPanelEmpty
                    icon={Package}
                    title="Stock levels look good"
                    description="Nothing is below your minimum threshold right now. We'll list items here when reordering is needed."
                    actionLabel="View inventory"
                    actionHref="/inventory"
                  />
                ) : (
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
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Expiring Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {overviewLoading ? '…' : expiringItems.length}
                </Badge>
              </CardHeader>
              <CardContent>
                {overviewLoading ? (
                  <DashboardPanelSkeleton rows={4} />
                ) : expiringItems.length === 0 ? (
                  <DashboardPanelEmpty
                    icon={Clock}
                    title="Nothing expiring soon"
                    description="No batches are due within the next 60 days. Add inventory with expiry dates to track them here."
                    actionLabel="Manage inventory"
                    actionHref="/inventory"
                  />
                ) : (
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
                    </div>
                  </ScrollArea>
                )}
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