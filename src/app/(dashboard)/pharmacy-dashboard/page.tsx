'use client'

import { useCallback, useState } from 'react'
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { ChartConfig, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BranchUsageWidget } from '@/components/branch-usage-widget'
import { BranchScopeFilter } from '@/components/shell/branch-scope-filter'
import { useBranchReportScope } from '@/hooks/useBranchReportScope'
import { SubscriptionWelcomeGate } from '@/components/dashboard'
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardStatCard,
  DashboardSectionCard,
  DashboardChartCard,
  DashboardButton,
  DashboardToolbar,
  DashboardTabsList,
  DashboardMetricGrid,
  DashboardPanelEmpty,
  DashboardPanelSkeleton,
  Dialog,
  DialogTrigger,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogBody,
  DashboardDialogFooter,
} from '@/components/dashboard'

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
  return (
    <SubscriptionWelcomeGate>
      <PharmacyDashboardContent />
    </SubscriptionWelcomeGate>
  )
}

function PharmacyDashboardContent() {
  const { branchScope, setBranchScope, scopeQuery, days } = useBranchReportScope()
  const statsQuery = usePharmacyDashboardStats({ scope: scopeQuery, scopeDays: days })
  const recentSalesQuery = useRecentPosSales({ scope: scopeQuery, scopeDays: days })
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

  useRealtimeUpdates(
    useCallback(
      (update) => {
        if (update.type === 'inventory_update') {
          void invalidateStockAlerts()
        }
        if (update.type === 'new_sale') {
          void invalidateStats()
          void invalidateRecentSales()
        }
      },
      [invalidateStats, invalidateRecentSales, invalidateStockAlerts],
    ),
  )

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

  const salesChartConfig = {
    revenue: { label: 'Revenue', color: 'hsl(var(--chart-1))' },
  } satisfies ChartConfig

  const SalesChart = () => (
    <DashboardChartCard
      title="Sales performance"
      description="Monthly revenue trends"
      config={salesChartConfig}
      loading={salesChartQuery.isPending}
    >
      <AreaChart data={salesChartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--chart-1))"
          fill="hsl(var(--chart-1))"
          fillOpacity={0.2}
        />
      </AreaChart>
    </DashboardChartCard>
  )

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="Pharmacy Dashboard"
        description="Overview for your pharmacy — scoped by branch when filtered below."
        actions={
          <DashboardToolbar>
          <BranchScopeFilter value={branchScope} onChange={setBranchScope} />
          <DashboardButton onClick={() => window.print()}>
            <Calendar className="h-4 w-4" />
            Export
          </DashboardButton>
          <Dialog open={isAddingPharmacist} onOpenChange={setIsAddingPharmacist}>
            <DialogTrigger asChild>
              <DashboardButton>
                <Pill className="h-4 w-4" />
                Add pharmacist
              </DashboardButton>
            </DialogTrigger>
            <DashboardDialogContent className="sm:max-w-[425px]">
              <DashboardDialogHeader>
                <DashboardDialogTitle>Add New Pharmacist</DashboardDialogTitle>
              </DashboardDialogHeader>
              <DashboardDialogBody className="grid gap-4">
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
              </DashboardDialogBody>
              <DashboardDialogFooter>
                <DashboardButton
                  tone="primary"
                  className="w-full sm:w-auto"
                  onClick={() => void handleAddPharmacist()}
                  disabled={
                    !newPharmacist.name ||
                    !newPharmacist.email ||
                    !newPharmacist.password ||
                    createPharmacistMutation.isPending
                  }
                >
                  {createPharmacistMutation.isPending ? 'Sending…' : 'Add Pharmacist'}
                </DashboardButton>
              </DashboardDialogFooter>
            </DashboardDialogContent>
          </Dialog>
          <DashboardButton
            tone="primary"
            onClick={() => { window.location.href = '/pos' }}
          >
            <ShoppingCart className="h-4 w-4" />
            New sale
          </DashboardButton>
          </DashboardToolbar>
        }
      />

      <DashboardMetricGrid columns={5}>
        <DashboardStatCard
          label="Today's sales"
          icon={DollarSign}
          loading={overviewLoading}
          value={`${localStats.todaySales.toLocaleString()} RWF`}
          hint={
            localStats.todaySales === 0 ? 'No sales today' : 'Total for today'
          }
        />
        <DashboardStatCard
          label="Products"
          icon={Package}
          loading={overviewLoading}
          value={localStats.totalProducts}
          hint={`${lowStockItems.length} low stock`}
        />
        <DashboardStatCard
          label="Customers"
          icon={Users}
          loading={overviewLoading}
          value={localStats.totalCustomers}
          hint="Unique customers"
        />
        <DashboardStatCard
          label="Low stock"
          icon={AlertTriangle}
          loading={overviewLoading}
          value={lowStockItems.length}
          hint="Below threshold"
        />
        <DashboardStatCard
          label="Expiring soon"
          icon={Clock}
          loading={overviewLoading}
          value={expiringItems.length}
          hint="Within 60 days"
        />
      </DashboardMetricGrid>

      <Tabs defaultValue="overview" className="space-y-4">
        <DashboardTabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </DashboardTabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Subscription & branch usage widget */}
          <BranchUsageWidget />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <DashboardSectionCard
              title="Recent sales"
              action={
                <DashboardButton tone="ghost" asChild>
                  <a href="/sales" aria-label="View all sales">
                    <Eye className="h-4 w-4" />
                  </a>
                </DashboardButton>
              }
            >
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
            </DashboardSectionCard>

            <DashboardSectionCard
              title="Stock alerts"
              description="Below minimum threshold"
              action={
                <Badge
                  variant={lowStockItems.length > 0 ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {overviewLoading ? '…' : lowStockItems.length}
                </Badge>
              }
            >
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
            </DashboardSectionCard>

            <DashboardSectionCard
              title="Expiring soon"
              description="Within 60 days"
              action={
                <Badge variant="outline" className="text-xs">
                  {overviewLoading ? '…' : expiringItems.length}
                </Badge>
              }
            >
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
            </DashboardSectionCard>
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
          <DashboardChartCard
            title="Monthly performance"
            description="Revenue trends from your sales data"
            config={salesChartConfig}
            loading={salesChartQuery.isPending}
          >
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
          </DashboardChartCard>
        </TabsContent>
      </Tabs>
    </DashboardPageShell>
  )
}