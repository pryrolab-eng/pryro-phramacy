'use client'

import { useState, useEffect } from 'react'
import { usePharmacyStore } from '@/hooks/usePharmacyStore'
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pill, Users, Clock, CheckCircle, AlertCircle, Search, UserCheck, Calendar, ShoppingCart, Plus, Package, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useRouter } from 'next/navigation'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface PharmacistStats {
  prescriptionsToday: number
  customersServed: number
  averageWaitTime: number
  completedSales: number
  pendingPrescriptions: number
  consultationsGiven: number
  inventoryChecks: number
  alertsHandled: number
}

interface PendingPrescription {
  id: string
  patient: string
  doctor: string
  medications: string[]
  priority: 'high' | 'medium' | 'low'
  time: string
  insurance: string
}

interface RecentActivity {
  id: string
  type: 'sale' | 'consultation' | 'prescription' | 'inventory'
  description: string
  time: string
  status: 'completed' | 'pending'
}

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

export default function PharmacistDashboard() {
  const router = useRouter()
  const { inventory, sales, alerts, setInventory, addSale, setAlerts } = usePharmacyStore()
  const [stats, setStats] = useState<PharmacistStats>({
    prescriptionsToday: 0,
    customersServed: 0,
    averageWaitTime: 8,
    completedSales: 0,
    pendingPrescriptions: 0,
    consultationsGiven: 0,
    inventoryChecks: 3,
    alertsHandled: 5
  })

  const [pendingPrescriptions, setPendingPrescriptions] = useState<PendingPrescription[]>([])

  // Real-time updates
  useRealtimeUpdates((update) => {
    if (update.type === 'inventory_update') {
      fetchStockAlerts()
    }
    if (update.type === 'new_sale') {
      fetchDashboardStats()
      fetchRecentActivities()
    }
  })

  useEffect(() => {
    fetchDashboardStats()
    fetchPendingPrescriptions()
    fetchStockAlerts()
    fetchRecentActivities()
    fetchChartData()
  }, [])

  const fetchRecentActivities = async () => {
    try {
      const response = await fetch('/api/pharmacist/activities')
      if (response.ok) {
        const data = await response.json()
        setRecentActivities(data)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const fetchChartData = async () => {
    try {
      const response = await fetch('/api/pharmacist/chart-data')
      if (response.ok) {
        const data = await response.json()
        setChartData(data)
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/pharmacist/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  const fetchPendingPrescriptions = async () => {
    try {
      const response = await fetch('/api/pharmacist/prescriptions')
      if (response.ok) {
        const data = await response.json()
        setPendingPrescriptions(data)
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
    }
  }

  const fetchStockAlerts = async () => {
    try {
      const response = await fetch('/api/stock-alerts')
      if (response.ok) {
        const data = await response.json()
        setStockAlerts(data.lowStock || [])
        setExpirationAlerts(data.expiring || [])
        setAlerts(data.all || [])
      }
    } catch (error) {
      console.error('Error fetching stock alerts:', error)
    }
  }



  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])

  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [expirationAlerts, setExpirationAlerts] = useState<ExpirationAlert[]>([])



  const [chartData, setChartData] = useState([])

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-3xl font-bold">Pharmacist Dashboard</h1>
            <p className="text-muted-foreground">Your daily workflow and patient care overview</p>
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
            <Pill className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.prescriptionsToday}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingPrescriptions} pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers Served</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customersServed}</div>
            <p className="text-xs text-muted-foreground">{stats.consultationsGiven} consultations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageWaitTime} min</div>
            <p className="text-xs text-muted-foreground">Below target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedSales}</div>
            <p className="text-xs text-muted-foreground">{stats.alertsHandled} alerts handled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
              Stock Alerts
            </CardTitle>
            <CardDescription>Low stock and out of stock items</CardDescription>
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
            <CardTitle className="flex items-center">
              <Package className="mr-2 h-5 w-5 text-orange-500" />
              Expiration Alerts
            </CardTitle>
            <CardDescription>Items expiring soon</CardDescription>
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
                  </div>
                  <div className="text-right">
                    <Badge variant={alert.daysUntilExpiry <= 7 ? 'destructive' : 'secondary'}>
                      {alert.daysUntilExpiry} days
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{alert.expiryDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5 text-orange-500" />
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
                  <div className="text-right">
                    <Badge className={`mb-2 ${getPriorityColor(prescription.priority)}`}>
                      {prescription.priority}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{prescription.insurance}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-green-500" />
            Recent Activities
          </CardTitle>
          <CardDescription>Your recent work activities</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity Trend</CardTitle>
            <CardDescription>Prescriptions and customers served throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="prescriptions" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Prescriptions"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="customers" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Customers"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used pharmacy operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button size="lg" className="w-full justify-start bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/pos')}>
                <ShoppingCart className="mr-3 h-5 w-5" />
                Open Point of Sale (POS)
              </Button>
              <Button variant="outline" size="lg" className="w-full justify-start" onClick={() => router.push('/inventory')}>
                <Plus className="mr-3 h-5 w-5" />
                Add New Drug to Inventory
              </Button>
              <Button variant="outline" size="lg" className="w-full justify-start" onClick={() => router.push('/inventory')}>
                <Search className="mr-3 h-5 w-5" />
                Search Drug Inventory
              </Button>
              <Button variant="outline" size="lg" className="w-full justify-start" onClick={() => router.push('/prescriptions')}>
                <Pill className="mr-3 h-5 w-5" />
                Process New Prescription
              </Button>
            </div>
            <div className="mt-6">
              <h4 className="font-medium mb-3">Daily Performance</h4>
              <div className="grid gap-3 grid-cols-2">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-xl font-bold">{stats.prescriptionsToday}</div>
                  <p className="text-xs text-muted-foreground">Prescriptions</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-xl font-bold">{stats.consultationsGiven}</div>
                  <p className="text-xs text-muted-foreground">Consultations</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}