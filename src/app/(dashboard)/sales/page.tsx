'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Receipt, DollarSign, TrendingUp, Calendar, Search, Filter, Download, ArrowUpRight, ArrowDownRight, Users, ShoppingCart, CreditCard, Banknote } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, CartesianGrid, LabelList, XAxis, YAxis, BarChart, Bar } from 'recharts'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
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

function WeeklySalesChart({ data }) {
  const weeklyData = data.length > 0 ? data : [
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
        <CardTitle className="text-sm">Weekly Sales Trend</CardTitle>
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

function HourlySalesChart({ data }) {
  const hourlyData = data?.length > 0 ? data : [
    { hour: '8AM', sales: 5000 },
    { hour: '9AM', sales: 8000 },
    { hour: '10AM', sales: 12000 },
    { hour: '11AM', sales: 15000 },
    { hour: '12PM', sales: 18000 },
    { hour: '1PM', sales: 14000 },
    { hour: '2PM', sales: 16000 },
    { hour: '3PM', sales: 13000 }
  ]

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-sm">Today's Hourly Sales</CardTitle>
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
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [stats, setStats] = useState({
    todayTotal: 0,
    weekTotal: 0,
    monthTotal: 0,
    totalSales: 0
  })
  const [analyticsData, setAnalyticsData] = useState({
    weeklySales: [],
    paymentBreakdown: [],
    hourlySales: [],
    monthlyComparison: [],
    customerDistribution: [],
    topCategories: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSales()
    fetchAnalytics()
  }, [])
  
  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/sales/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  useEffect(() => {
    filterSales()
  }, [sales, searchTerm, selectedPeriod])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sales')
      if (response.ok) {
        const data = await response.json()
        setSales(data.sales)
        setStats(data.stats)
      }
    } catch (error) {
      const mockSales = [
        { id: '1', customer: 'Marie Uwimana', amount: 15000, items: 3, date: '2024-12-01', paymentMethod: 'Cash', status: 'completed' },
        { id: '2', customer: 'Jean Baptiste', amount: 8500, items: 2, date: '2024-12-01', paymentMethod: 'Mobile Money', status: 'completed' },
        { id: '3', customer: 'Grace Mukamana', amount: 25000, items: 5, date: '2024-12-01', paymentMethod: 'Insurance', status: 'completed' },
        { id: '4', customer: 'Paul Nkurunziza', amount: 12000, items: 2, date: '2024-12-01', paymentMethod: 'Card', status: 'completed' },
        { id: '5', customer: 'Alice Uwera', amount: 18500, items: 4, date: '2024-11-30', paymentMethod: 'Cash', status: 'completed' }
      ]
      setSales(mockSales)
      setStats({ todayTotal: 70500, weekTotal: 456000, monthTotal: 1890000, totalSales: 156 })
    } finally {
      setLoading(false)
    }
  }

  const filterSales = () => {
    let filtered = sales
    
    if (searchTerm) {
      filtered = filtered.filter(sale => 
        sale.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    if (selectedPeriod === 'today') {
      filtered = filtered.filter(sale => new Date(sale.date) >= today)
    } else if (selectedPeriod === 'week') {
      filtered = filtered.filter(sale => new Date(sale.date) >= weekAgo)
    } else if (selectedPeriod === 'month') {
      filtered = filtered.filter(sale => new Date(sale.date) >= monthAgo)
    }
    
    setFilteredSales(filtered)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-xl font-bold">Sales Dashboard</h1>
            <p className="text-sm text-muted-foreground">Track your sales performance and transactions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Receipt className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayTotal.toLocaleString()} RWF</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              +15% from yesterday
            </div>
            <Progress value={75} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekTotal.toLocaleString()} RWF</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              +8% from last week
            </div>
            <Progress value={68} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthTotal.toLocaleString()} RWF</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              +12% from last month
            </div>
            <Progress value={82} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
              +5% from yesterday
            </div>
            <Progress value={60} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <WeeklySalesChart data={analyticsData.weeklySales} />
            <HourlySalesChart data={analyticsData.hourlySales} />
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Payment Methods</CardTitle>
                <CardDescription>Sales breakdown by payment type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.paymentBreakdown.map((payment, index) => {
                    const icons = {
                      cash: <Banknote className="h-4 w-4 text-green-600" />,
                      mobile_money: <CreditCard className="h-4 w-4 text-blue-600" />,
                      insurance: <Users className="h-4 w-4 text-purple-600" />,
                      card: <CreditCard className="h-4 w-4 text-orange-600" />
                    }
                    const labels = {
                      cash: 'Cash',
                      mobile_money: 'Mobile Money',
                      insurance: 'Insurance',
                      card: 'Card'
                    }
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {icons[payment.method] || <CreditCard className="h-4 w-4" />}
                          <span className="text-sm font-medium">{labels[payment.method] || payment.method}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={payment.percentage} className="w-20" />
                          <span className="text-sm text-muted-foreground">{payment.percentage}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top Categories</CardTitle>
                <CardDescription>Best selling product categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(analyticsData.topCategories?.length > 0 ? analyticsData.topCategories : [
                    { name: 'Prescription', value: 40, color: 'bg-red-500' },
                    { name: 'OTC Medicines', value: 25, color: 'bg-green-500' },
                    { name: 'Supplements', value: 20, color: 'bg-blue-500' },
                    { name: 'Personal Care', value: 15, color: 'bg-yellow-500' }
                  ]).map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${category.color}`} />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={category.value} className="w-20" />
                        <span className="text-sm text-muted-foreground">{category.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Sales</CardTitle>
                <CardDescription>Latest transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {sales.slice(0, 5).map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between p-2 rounded-lg border">
                        <div>
                          <p className="text-sm font-medium">{sale.customer}</p>
                          <p className="text-xs text-muted-foreground">{sale.items} items</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{sale.amount.toLocaleString()} RWF</p>
                          <Badge variant="outline" className="text-xs">{sale.paymentMethod}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Sales Transactions</CardTitle>
                  <CardDescription>Detailed view of all sales transactions</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.customer}</TableCell>
                      <TableCell>{sale.items}</TableCell>
                      <TableCell className="font-semibold">{sale.amount.toLocaleString()} RWF</TableCell>
                      <TableCell>
                        <Badge variant="outline">{sale.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell>{new Date(sale.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                          {sale.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sales Performance</CardTitle>
                <CardDescription>Monthly comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{
                  current: { label: "Current Month", color: "#3b82f6" },
                  previous: { label: "Previous Month", color: "#60a5fa" }
                }}>
                  <BarChart data={analyticsData.monthlyComparison?.length > 0 ? analyticsData.monthlyComparison : [
                    { week: "Week 1", current: 450000, previous: 380000 },
                    { week: "Week 2", current: 520000, previous: 420000 },
                    { week: "Week 3", current: 480000, previous: 460000 },
                    { week: "Week 4", current: 580000, previous: 510000 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="current" fill="#3b82f6" radius={4} />
                    <Bar dataKey="previous" fill="#60a5fa" radius={4} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customer Distribution</CardTitle>
                <CardDescription>Sales by customer type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.customerDistribution?.length > 0 ? analyticsData.customerDistribution : [
                          {name: 'Walk-in', value: 55, fill: '#8b5cf6'},
                          {name: 'Regular', value: 30, fill: '#10b981'},
                          {name: 'Insurance', value: 15, fill: '#3b82f6'}
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded" />
                    <span>Walk-in Customers (55%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span>Regular Customers (30%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span>Insurance Customers (15%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>


    </div>
  )
}