'use client'

import { useEffect } from 'react'
import { usePharmacyStore } from '@/hooks/usePharmacyStore'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import {
  useInvalidatePharmacistDashboard,
  usePharmacistActivities,
  usePharmacistChartData,
  usePharmacistDashboardStats,
  usePharmacistPrescriptions,
  usePharmacistStockAlerts,
  useProcessPharmacistPrescriptionMutation,
  useTrackPharmacistActivityMutation,
  type PharmacistActivity,
  type PharmacistStats,
  type PendingPrescription,
} from '@/hooks/usePharmacistDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Pill, Users, Clock, CheckCircle, AlertCircle, Search, UserCheck, Calendar, ShoppingCart, Plus, Package, AlertTriangle, ArrowUpRight, Activity, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useRouter } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { LoadingState, LoadingCard } from '@/components/loading-state'
import { Spinner } from '@/components/ui/spinner'
import type { StockAlertRow } from '@/lib/http/pharmacy-dashboard'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface StockAlert {
  id: string
  drugName: string
  currentStock: number
  minStock: number
  status: 'low' | 'out'
}

interface ExpirationAlert {
  id: string
  drugName: string
  batchNumber: string
  expiryDate: string
  daysUntilExpiry: number
  quantity: number
}

function toStockAlert(row: StockAlertRow): StockAlert {
  return {
    id: row.id,
    drugName: row.product,
    currentStock: row.current_stock,
    minStock: row.min_stock,
    status: row.current_stock <= 0 ? 'out' : 'low',
  }
}

function toExpirationAlert(row: StockAlertRow): ExpirationAlert {
  return {
    id: row.id,
    drugName: row.product,
    batchNumber: '',
    expiryDate: '',
    daysUntilExpiry: row.expires_in,
    quantity: row.current_stock,
  }
}

export default function PharmacistDashboard() {
  const router = useRouter()
  const { setAlerts } = usePharmacyStore()
  const invalidate = useInvalidatePharmacistDashboard()

  const statsQuery = usePharmacistDashboardStats()
  const prescriptionsQuery = usePharmacistPrescriptions()
  const stockAlertsQuery = usePharmacistStockAlerts()
  const activitiesQuery = usePharmacistActivities()
  const chartQuery = usePharmacistChartData()
  const trackActivityMutation = useTrackPharmacistActivityMutation()
  const prescriptionActionMutation = useProcessPharmacistPrescriptionMutation()

  const stats: PharmacistStats = statsQuery.data ?? {
    prescriptionsToday: 0,
    customersServed: 0,
    averageWaitTime: 0,
    completedSales: 0,
    pendingPrescriptions: 0,
    consultationsGiven: 0,
    inventoryChecks: 0,
    alertsHandled: 0,
  }
  const pendingPrescriptions: PendingPrescription[] =
    prescriptionsQuery.data ?? []
  const recentActivities: PharmacistActivity[] = activitiesQuery.data ?? []
  const chartData = chartQuery.data ?? []

  useEffect(() => {
    const data = stockAlertsQuery.data
    if (data) setAlerts(data.all ?? [])
  }, [stockAlertsQuery.data, setAlerts])

  const stockAlerts = (stockAlertsQuery.data?.lowStock ?? []).map(toStockAlert)
  const expirationAlerts = (stockAlertsQuery.data?.expiring ?? []).map(
    toExpirationAlert,
  )

  const loadingStates = {
    stats: statsQuery.isPending,
    prescriptions: prescriptionsQuery.isPending,
    alerts: stockAlertsQuery.isPending,
    activities: activitiesQuery.isPending,
    charts: chartQuery.isPending,
  }

  const isLoading =
    statsQuery.isPending ||
    prescriptionsQuery.isPending ||
    stockAlertsQuery.isPending ||
    activitiesQuery.isPending ||
    chartQuery.isPending

  useRealtimeUpdates((update) => {
    if (update.type === 'inventory_update') {
      void invalidate.invalidateStockAlerts()
    }
    if (update.type === 'new_sale') {
      void invalidate.invalidateStats()
      void invalidate.invalidateActivities()
    }
  })

  const trackActivity = (type: string, data: Record<string, unknown>) => {
    trackActivityMutation.mutate({ type, data })
  }

  const handleInventoryCheck = (inventoryId: string) => {
    trackActivity('inventory_check', { inventoryId, checkType: 'manual' })
  }

  const handleAlertAction = (
    alertType: string,
    referenceId: string,
    action: string,
  ) => {
    trackActivity('alert_action', { alertType, referenceId, action })
  }

  const handlePrescriptionAction = async (
    prescriptionId: string,
    action: string,
  ) => {
    try {
      await prescriptionActionMutation.mutateAsync({ prescriptionId, action })
    } catch (error) {
      console.error('Error processing prescription:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'prescription': return <Pill className="h-4 w-4" />
      case 'consultation': return <UserCheck className="h-4 w-4" />
      case 'sale': return <CheckCircle className="h-4 w-4" />
      case 'inventory': return <Search className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (isLoading) return (
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
            <h1 className="text-xl font-bold">Pharmacist Dashboard</h1>
            <p className="text-sm text-muted-foreground">Your daily workflow and patient care overview</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/pos')}>
            <ShoppingCart className="mr-2 h-5 w-5" />
            Open POS
          </Button>
          <Button variant="outline" onClick={() => router.push('/inventory')}>
            <Plus className="mr-2 h-4 w-4" />
            Add Drug
          </Button>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions Today</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Pill className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.prescriptionsToday}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              {stats.pendingPrescriptions} pending
            </div>
            <Progress value={85} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers Served</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customersServed}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              {stats.consultationsGiven} consultations
            </div>
            <Progress value={72} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageWaitTime} min</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Activity className="h-3 w-3 text-green-500 mr-1" />
              Below target
            </div>
            <Progress value={40} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedSales}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              {stats.alertsHandled} alerts handled
            </div>
            <Progress value={90} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                  Stock Alerts
                </CardTitle>
                <CardDescription>Low stock and out of stock items</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {stockAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{alert.drugName}</p>
                          <p className="text-xs text-muted-foreground">
                            Current: {alert.currentStock} | Min: {alert.minStock}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Badge variant={alert.status === 'out' ? 'destructive' : 'secondary'}>
                            {alert.status === 'out' ? 'Out' : 'Low'}
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => handleAlertAction('stock_low', alert.id, 'noted')}>
                            ✓
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Package className="mr-2 h-4 w-4 text-orange-500" />
                  Expiration Alerts
                </CardTitle>
                <CardDescription>Items expiring soon</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {expirationAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{alert.drugName}</p>
                          <p className="text-xs text-muted-foreground">
                            Batch: {alert.batchNumber}
                          </p>
                        </div>
                        <div className="text-right flex gap-1">
                          <Badge variant={alert.daysUntilExpiry <= 7 ? 'destructive' : 'secondary'}>
                            {alert.daysUntilExpiry}d
                          </Badge>
                          <Button size="sm" variant="outline" onClick={() => handleAlertAction('expiring', alert.id, 'noted')}>
                            ✓
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
                <CardDescription>Frequently used operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button size="sm" className="w-full justify-start" onClick={() => router.push('/pos')}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Open POS
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => router.push('/inventory')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Drug
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => router.push('/prescriptions')}>
                    <Pill className="mr-2 h-4 w-4" />
                    New Prescription
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => handleInventoryCheck('manual')}>
                    <Search className="mr-2 h-4 w-4" />
                    Check Inventory
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="prescriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-sm">
                <AlertCircle className="mr-2 h-4 w-4 text-blue-500" />
                Pending Prescriptions
              </CardTitle>
              <CardDescription>Prescriptions awaiting dispensing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPrescriptions.map((prescription) => (
                  <div key={prescription.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Pill className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{prescription.patient}</p>
                        <p className="text-sm text-muted-foreground">Dr. {prescription.doctor} • {prescription.time}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prescription.medications.slice(0, 2).map((med, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {med}
                            </Badge>
                          ))}
                          {prescription.medications.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{prescription.medications.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge className={getPriorityColor(prescription.priority)}>
                        {prescription.priority}
                      </Badge>
                      <p className="text-sm text-muted-foreground">{prescription.insurance}</p>
                      <div className="flex gap-1">
                        <Button size="sm" onClick={() => handlePrescriptionAction(prescription.id, 'start')}>
                          Start
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handlePrescriptionAction(prescription.id, 'dispense')}>
                          Dispense
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                  Stock Alerts
                </CardTitle>
                <CardDescription>Detailed view of stock issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stockAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{alert.drugName}</p>
                        <p className="text-xs text-muted-foreground">
                          Current: {alert.currentStock} | Min: {alert.minStock}
                        </p>
                        <Progress value={(alert.currentStock / alert.minStock) * 100} className="w-32 mt-1" />
                      </div>
                      <Badge variant={alert.status === 'out' ? 'destructive' : 'secondary'}>
                        {alert.status === 'out' ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Package className="mr-2 h-4 w-4 text-orange-500" />
                  Expiration Alerts
                </CardTitle>
                <CardDescription>Detailed expiration tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {expirationAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{alert.drugName}</p>
                        <p className="text-xs text-muted-foreground">
                          Batch: {alert.batchNumber} | Qty: {alert.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">Expires: {alert.expiryDate}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={alert.daysUntilExpiry <= 7 ? 'destructive' : 'secondary'}>
                          {alert.daysUntilExpiry} days
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Daily Activity Trend</CardTitle>
                <CardDescription>Prescriptions and customers served</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  prescriptions: { label: "Prescriptions", color: "#3b82f6" },
                  customers: { label: "Customers", color: "#60a5fa" }
                }}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="prescriptions" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="customers" 
                      stroke="#60a5fa" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Performance Metrics</CardTitle>
                <CardDescription>Weekly comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  thisWeek: { label: "This Week", color: "#3b82f6" },
                  lastWeek: { label: "Last Week", color: "#60a5fa" }
                }}>
                  <BarChart data={[
                    { day: "Mon", thisWeek: 12, lastWeek: 8 },
                    { day: "Tue", thisWeek: 15, lastWeek: 12 },
                    { day: "Wed", thisWeek: 18, lastWeek: 14 },
                    { day: "Thu", thisWeek: 14, lastWeek: 16 },
                    { day: "Fri", thisWeek: 20, lastWeek: 18 },
                    { day: "Sat", thisWeek: 16, lastWeek: 15 },
                    { day: "Sun", thisWeek: 10, lastWeek: 8 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="thisWeek" fill="#3b82f6" radius={4} />
                    <Bar dataKey="lastWeek" fill="#60a5fa" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <Clock className="mr-2 h-4 w-4 text-green-500" />
            Recent Activities
          </CardTitle>
          <CardDescription>Your recent work activities</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Badge variant={activity.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}