'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Phone, Mail, Calendar } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  totalPurchases: number
  lastVisit: string
  status: 'active' | 'inactive'
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newThisMonth: 0
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
        setStats(data.stats)
      }
    } catch (error) {
      setCustomers([
        { id: '1', name: 'Marie Uwimana', phone: '+250788123456', email: 'marie@email.com', totalPurchases: 45000, lastVisit: '2024-12-01', status: 'active' },
        { id: '2', name: 'Jean Baptiste', phone: '+250788123457', email: 'jean@email.com', totalPurchases: 23000, lastVisit: '2024-11-28', status: 'active' }
      ])
      setStats({ totalCustomers: 156, activeCustomers: 142, newThisMonth: 12 })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <p className="text-muted-foreground">Manage your pharmacy customers and relationships</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <div className="h-8 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:140},{v:145},{v:150},{v:152},{v:154},{v:stats.totalCustomers}]}>
                  <Area type="monotone" dataKey="v" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.08} strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCustomers}</div>
            <div className="h-8 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:135},{v:138},{v:140},{v:141},{v:142},{v:stats.activeCustomers}]}>
                  <Area type="monotone" dataKey="v" stroke="#10b981" fill="#10b981" fillOpacity={0.08} strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newThisMonth}</div>
            <div className="h-8 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:8},{v:10},{v:11},{v:12},{v:11},{v:stats.newThisMonth}]}>
                  <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>Manage your customer database</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {customers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        {customer.phone}
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        {customer.email}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold">{customer.totalPurchases.toLocaleString()} RWF</p>
                  <p className="text-sm text-muted-foreground">Last visit: {customer.lastVisit}</p>
                  <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                    {customer.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}