'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Receipt, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, CartesianGrid, LabelList, XAxis } from 'recharts'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface Sale {
  id: string
  customer: string
  amount: number
  items: number
  date: string
  paymentMethod: string
  status: string
}

const weeklyChartConfig = {
  sales: {
    label: "Sales (RWF)",
    color: "#3b82f6",
  },
} satisfies ChartConfig

const hourlyChartConfig = {
  sales: {
    label: "Sales (RWF)",
    color: "#10b981",
  },
} satisfies ChartConfig

function WeeklySalesChart() {
  const weeklyData = [
    { day: "Mon", sales: 120000 },
    { day: "Tue", sales: 135000 },
    { day: "Wed", sales: 142000 },
    { day: "Thu", sales: 138000 },
    { day: "Fri", sales: 150000 },
    { day: "Sat", sales: 148000 },
    { day: "Sun", sales: 156000 },
  ]

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Weekly Sales Trend</CardTitle>
        <CardDescription>Daily sales performance over the past week</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={weeklyChartConfig} className="h-64">
          <LineChart
            accessibilityLayer
            data={weeklyData}
            margin={{
              top: 20,
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="sales"
              type="natural"
              stroke="var(--color-sales)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-sales)",
              }}
              activeDot={{
                r: 6,
              }}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                formatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function HourlySalesChart() {
  const generateHourlyData = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const data = []
    
    // Generate data for the last 8 hours up to current hour
    for (let i = 7; i >= 0; i--) {
      const hour = currentHour - i
      const adjustedHour = hour < 0 ? hour + 24 : hour
      const timeStr = adjustedHour === 0 ? '12AM' : 
                     adjustedHour < 12 ? `${adjustedHour}AM` :
                     adjustedHour === 12 ? '12PM' :
                     `${adjustedHour - 12}PM`
      
      // Simulate sales data based on typical pharmacy hours
      const baseSales = adjustedHour >= 8 && adjustedHour <= 20 ? 
                       Math.random() * 15000 + 5000 : 
                       Math.random() * 3000 + 1000
      
      data.push({
        hour: timeStr,
        sales: Math.round(baseSales)
      })
    }
    return data
  }
  
  const hourlyData = generateHourlyData()

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Today's Hourly Sales</CardTitle>
        <CardDescription>Sales performance throughout the day</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={hourlyChartConfig} className="h-64">
          <LineChart
            accessibilityLayer
            data={hourlyData}
            margin={{
              top: 20,
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="sales"
              type="natural"
              stroke="var(--color-sales)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-sales)",
              }}
              activeDot={{
                r: 6,
              }}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                formatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [stats, setStats] = useState({
    todayTotal: 0,
    weekTotal: 0,
    monthTotal: 0,
    totalSales: 0
  })

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/sales')
      if (response.ok) {
        const data = await response.json()
        setSales(data.sales)
        setStats(data.stats)
      }
    } catch (error) {
      setSales([
        { id: '1', customer: 'Marie Uwimana', amount: 15000, items: 3, date: '2024-12-01', paymentMethod: 'Cash', status: 'completed' },
        { id: '2', customer: 'Jean Baptiste', amount: 8500, items: 2, date: '2024-12-01', paymentMethod: 'Mobile Money', status: 'completed' }
      ])
      setStats({ todayTotal: 23500, weekTotal: 156000, monthTotal: 890000, totalSales: 45 })
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="h-4 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold">Sales Reports</h1>
          <p className="text-muted-foreground">Track your sales performance and transactions</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayTotal.toLocaleString()} RWF</div>
            <div className="h-8 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{v:12000},{v:15000},{v:18000},{v:16000},{v:20000},{v:23500}]}>
                  <Line type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-1">+15% from yesterday</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekTotal.toLocaleString()} RWF</div>
            <div className="h-8 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{v:120000},{v:135000},{v:142000},{v:138000},{v:150000},{v:148000},{v:156000}]}>
                  <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-1">+8% from last week</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthTotal.toLocaleString()} RWF</div>
            <div className="h-8 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{v:750000},{v:780000},{v:820000},{v:850000},{v:870000},{v:890000}]}>
                  <Line type="monotone" dataKey="v" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <div className="h-8 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{v:35},{v:38},{v:40},{v:42},{v:44},{v:45}]}>
                  <Line type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Transactions count</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Latest transactions and sales history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{sale.customer || 'Walk-in Customer'}</p>
                    <p className="text-sm text-muted-foreground">{sale.items} items • {sale.date}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-semibold">{sale.amount.toLocaleString()} RWF</p>
                  <div className="flex space-x-2">
                    <Badge variant="outline">{sale.paymentMethod}</Badge>
                    <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                      {sale.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <WeeklySalesChart />
        <HourlySalesChart />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Sales breakdown by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {name: 'Cash', value: 45},
                      {name: 'Mobile Money', value: 30},
                      {name: 'Insurance', value: 20},
                      {name: 'Card', value: 5}
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={70}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#3b82f6" />
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded"></div>Cash 45%</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded"></div>Mobile 30%</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded"></div>Insurance 20%</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded"></div>Card 5%</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Best selling product categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {name: 'Prescription', value: 40},
                      {name: 'OTC', value: 25},
                      {name: 'Supplements', value: 20},
                      {name: 'Personal Care', value: 15}
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={70}
                    dataKey="value"
                  >
                    <Cell fill="#ef4444" />
                    <Cell fill="#10b981" />
                    <Cell fill="#3b82f6" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded"></div>Prescription 40%</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded"></div>OTC 25%</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded"></div>Supplements 20%</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded"></div>Personal Care 15%</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Customer Types</CardTitle>
            <CardDescription>Sales distribution by customer type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {name: 'Walk-in', value: 55},
                      {name: 'Regular', value: 30},
                      {name: 'Insurance', value: 15}
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={70}
                    dataKey="value"
                  >
                    <Cell fill="#8b5cf6" />
                    <Cell fill="#10b981" />
                    <Cell fill="#3b82f6" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-purple-500 rounded"></div>Walk-in 55%</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded"></div>Regular 30%</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded"></div>Insurance 15%</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}