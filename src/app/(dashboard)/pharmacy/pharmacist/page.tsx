'use client'

import { useEffect } from 'react'
import { usePharmacyStore } from '@/hooks/usePharmacyStore'
import {
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Pill, Users, Clock, CheckCircle, AlertCircle, Search, UserCheck, ShoppingCart, Plus, Package, AlertTriangle, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useRouter } from 'next/navigation'
import type { StockAlertRow } from '@/lib/http/pharmacy-dashboard'
import { PHARMACY_ROUTES } from '@/lib/routes/pharmacy-paths'
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
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
  SubscriptionWelcomeGate,
} from '@/components/dashboard'

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
  return (
    <SubscriptionWelcomeGate>
      <PharmacistDashboardContent />
    </SubscriptionWelcomeGate>
  )
}

function PharmacistDashboardContent() {
  const router = useRouter()
  const { setAlerts } = usePharmacyStore()

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

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="Pharmacist Dashboard"
        description="Your daily workflow and patient care overview."
        actions={
          <DashboardToolbar>
            <DashboardButton
              tone="primary"
              onClick={() => router.push(PHARMACY_ROUTES.pos)}
            >
              <ShoppingCart className="h-4 w-4" />
              Open POS
            </DashboardButton>
            <DashboardButton onClick={() => router.push(PHARMACY_ROUTES.inventory)}>
              <Plus className="h-4 w-4" />
              Add drug
            </DashboardButton>
          </DashboardToolbar>
        }
      />

      <DashboardMetricGrid>
        <DashboardStatCard
          label="Prescriptions today"
          icon={Pill}
          loading={loadingStates.stats}
          value={stats.prescriptionsToday}
          hint={`${stats.pendingPrescriptions} pending`}
        />
        <DashboardStatCard
          label="Customers served"
          icon={Users}
          loading={loadingStates.stats}
          value={stats.customersServed}
          hint={`${stats.consultationsGiven} consultations`}
        />
        <DashboardStatCard
          label="Avg wait"
          icon={Clock}
          loading={loadingStates.stats}
          value={`${stats.averageWaitTime} min`}
          hint="Target under 15 min"
        />
        <DashboardStatCard
          label="Completed sales"
          icon={CheckCircle}
          loading={loadingStates.stats}
          value={stats.completedSales}
          hint={`${stats.alertsHandled} alerts handled`}
        />
      </DashboardMetricGrid>

      <Tabs defaultValue="overview" className="space-y-4">
        <DashboardTabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </DashboardTabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            <DashboardSectionCard
              title="Stock alerts"
              description="Low stock and out of stock items"
            >
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
            </DashboardSectionCard>

            <DashboardSectionCard
              title="Expiration alerts"
              description="Items expiring soon"
            >
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
            </DashboardSectionCard>

            <DashboardSectionCard
              title="Quick actions"
              description="Frequently used operations"
            >
                <div className="space-y-2">
                  <Button size="sm" className="w-full justify-start" onClick={() => router.push(PHARMACY_ROUTES.pos)}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Open POS
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => router.push(PHARMACY_ROUTES.inventory)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Drug
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => router.push(PHARMACY_ROUTES.prescriptions)}>
                    <Pill className="mr-2 h-4 w-4" />
                    New Prescription
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => handleInventoryCheck('manual')}>
                    <Search className="mr-2 h-4 w-4" />
                    Check Inventory
                  </Button>
                </div>
            </DashboardSectionCard>
          </div>
        </TabsContent>
        
        <TabsContent value="prescriptions" className="space-y-4">
          <DashboardSectionCard
            title="Pending prescriptions"
            description="Prescriptions awaiting dispensing"
          >
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
          </DashboardSectionCard>
        </TabsContent>
        
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <DashboardSectionCard
              title="Stock alerts"
              description="Detailed view of stock issues"
            >
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
            </DashboardSectionCard>

            <DashboardSectionCard
              title="Expiration alerts"
              description="Detailed expiration tracking"
            >
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
            </DashboardSectionCard>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <DashboardChartCard
              title="Daily activity trend"
              description="Prescriptions and customers served"
              config={{
                prescriptions: { label: 'Prescriptions', color: '#3b82f6' },
                customers: { label: 'Customers', color: '#60a5fa' },
              }}
              loading={loadingStates.charts}
            >
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
            </DashboardChartCard>

            <DashboardChartCard
              title="Performance metrics"
              description="Weekly comparison"
              config={{
                thisWeek: { label: 'This Week', color: '#3b82f6' },
                lastWeek: { label: 'Last Week', color: '#60a5fa' },
              }}
            >
              <BarChart
                data={[
                  { day: 'Mon', thisWeek: 12, lastWeek: 8 },
                  { day: 'Tue', thisWeek: 15, lastWeek: 12 },
                  { day: 'Wed', thisWeek: 18, lastWeek: 14 },
                  { day: 'Thu', thisWeek: 14, lastWeek: 16 },
                  { day: 'Fri', thisWeek: 20, lastWeek: 18 },
                  { day: 'Sat', thisWeek: 16, lastWeek: 15 },
                  { day: 'Sun', thisWeek: 10, lastWeek: 8 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="thisWeek" fill="#3b82f6" radius={4} />
                <Bar dataKey="lastWeek" fill="#60a5fa" radius={4} />
              </BarChart>
            </DashboardChartCard>
          </div>
        </TabsContent>
      </Tabs>

      <DashboardSectionCard
        title="Recent activities"
        description="Your recent work activities"
      >
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
      </DashboardSectionCard>
    </DashboardPageShell>
  )
}