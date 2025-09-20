'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pill, Users, Clock, CheckCircle, AlertCircle, Search, UserCheck, Calendar } from 'lucide-react'

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

export default function PharmacistDashboard() {
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
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule
          </Button>
          <Button>
            <Pill className="mr-2 h-4 w-4" />
            New Prescription
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prescriptions Today</CardTitle>
            <Pill className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.prescriptionsToday}</div>
            <p className="text-xs opacity-80">{stats.pendingPrescriptions} pending</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers Served</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customersServed}</div>
            <p className="text-xs opacity-80">{stats.consultationsGiven} consultations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageWaitTime} min</div>
            <p className="text-xs opacity-80">Below target</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedSales}</div>
            <p className="text-xs opacity-80">{stats.alertsHandled} alerts handled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Performance</CardTitle>
          <CardDescription>Your productivity metrics for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.prescriptionsToday}</div>
              <p className="text-sm text-muted-foreground">Prescriptions Filled</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.consultationsGiven}</div>
              <p className="text-sm text-muted-foreground">Patient Consultations</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.inventoryChecks}</div>
              <p className="text-sm text-muted-foreground">Inventory Checks</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">95%</div>
              <p className="text-sm text-muted-foreground">Accuracy Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}