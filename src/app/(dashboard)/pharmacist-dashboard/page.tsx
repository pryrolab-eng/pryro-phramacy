'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pill, Users, Clock, CheckCircle, AlertCircle, Search, UserCheck, Calendar, ShoppingCart, Plus, Package, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useRouter } from 'next/navigation'

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
  const [stats, setStats] = useState<PharmacistStats>({
    prescriptionsToday: 28,
    customersServed: 45,
    averageWaitTime: 8,
    completedSales: 32,
    pendingPrescriptions: 6,
    consultationsGiven: 12,
    inventoryChecks: 3,
    alertsHandled: 5
  })

  const [pendingPrescriptions] = useState<PendingPrescription[]>([
    {
      id: '1',
      patient: 'Alice Mukamana',
      doctor: 'Dr. Uwimana',
      medications: ['Amoxicillin 500mg', 'Paracetamol 500mg'],
      priority: 'high',
      time: '10:30 AM',
      insurance: 'RSSB'
    },
    {
      id: '2',
      patient: 'John Nkurunziza',
      doctor: 'Dr. Habimana',
      medications: ['Metformin 850mg', 'Lisinopril 10mg'],
      priority: 'medium',
      time: '11:15 AM',
      insurance: 'Radiant'
    },
    {
      id: '3',
      patient: 'Grace Uwase',
      doctor: 'Dr. Mutesi',
      medications: ['Vitamin D3', 'Calcium tablets'],
      priority: 'low',
      time: '11:45 AM',
      insurance: 'None'
    }
  ])

  const [recentActivities] = useState<RecentActivity[]>([
    { id: '1', type: 'prescription', description: 'Dispensed prescription for Marie Uwimana', time: '10:45 AM', status: 'completed' },
    { id: '2', type: 'consultation', description: 'Provided medication counseling', time: '10:30 AM', status: 'completed' },
    { id: '3', type: 'sale', description: 'OTC sale - Pain relief medication', time: '10:15 AM', status: 'completed' },
    { id: '4', type: 'inventory', description: 'Stock check for antibiotics section', time: '09:30 AM', status: 'completed' }
  ])

  const [stockAlerts] = useState<StockAlert[]>([
    { id: '1', drugName: 'Paracetamol 500mg', currentStock: 5, minStock: 20, status: 'low' },
    { id: '2', drugName: 'Amoxicillin 250mg', currentStock: 0, minStock: 15, status: 'out' },
    { id: '3', drugName: 'Ibuprofen 400mg', currentStock: 8, minStock: 25, status: 'low' }
  ])

  const [expirationAlerts] = useState<ExpirationAlert[]>([
    { id: '1', drugName: 'Aspirin 100mg', batchNumber: 'ASP001', expiryDate: '2024-01-15', daysUntilExpiry: 5, quantity: 50 },
    { id: '2', drugName: 'Vitamin C 500mg', batchNumber: 'VTC002', expiryDate: '2024-01-20', daysUntilExpiry: 10, quantity: 30 },
    { id: '3', drugName: 'Cough Syrup', batchNumber: 'CS003', expiryDate: '2024-01-25', daysUntilExpiry: 15, quantity: 12 }
  ])



  const chartData = [
    { time: '9:00', prescriptions: 5, customers: 8 },
    { time: '10:00', prescriptions: 12, customers: 15 },
    { time: '11:00', prescriptions: 18, customers: 22 },
    { time: '12:00', prescriptions: 25, customers: 30 },
    { time: '13:00', prescriptions: 28, customers: 35 },
    { time: '14:00', prescriptions: 32, customers: 40 },
    { time: '15:00', prescriptions: 35, customers: 45 }
  ]

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
        <div>
          <h1 className="text-3xl font-bold">Pharmacist Dashboard</h1>
          <p className="text-muted-foreground">Your daily workflow and patient care overview</p>
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
              <Button variant="outline" size="lg" className="w-full justify-start">
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