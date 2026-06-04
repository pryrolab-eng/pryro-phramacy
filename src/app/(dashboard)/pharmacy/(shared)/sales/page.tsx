'use client'

import { PHARMACY_ROUTES } from '@/lib/routes/pharmacy-paths'

import { useState, useMemo, type ReactNode } from 'react'
import { useSalesAnalytics, useSalesList } from '@/hooks/useSales'
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
import {
  DashboardPageHeader,
  DashboardPageShell,
  DashboardToolbar,
  DashboardButton,
  DashboardMetricGrid,
  DashboardStatCard,
  DashboardTabsList,
  DashboardChartCard,
  DashboardSectionCard,
  DashboardTableCard,
  DashboardSearchInput,
  DashboardListRow,
  DashboardProgressTrack,
  DashboardPageLoading,
} from '@/components/dashboard'
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

interface AnalyticsData {
  weeklySales: Array<{ day?: string; sales: number }>
  paymentBreakdown: Array<{ method: string; percentage: number }>
  hourlySales: Array<{ hour?: string; sales: number }>
  monthlyComparison: Array<{ month?: string; sales: number }>
  customerDistribution: Array<{ name: string; value: number }>
  topCategories: Array<{ name: string; value: number; color: string }>
}

function WeeklySalesChart({ data }: { data: Array<{ day?: string; sales: number }> }) {
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
    <DashboardChartCard
      title="Weekly sales trend"
      description="Daily sales performance over the past week"
      config={weeklyChartConfig}
      chartClassName="h-64"
    >
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
                formatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
              />
            </Line>
          </LineChart>
    </DashboardChartCard>
  )
}

function HourlySalesChart({ data }: { data: Array<{ hour?: string; sales: number }> }) {
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
    <DashboardChartCard
      title="Today's hourly sales"
      description="Sales performance throughout the day"
      config={hourlyChartConfig}
      chartClassName="h-64"
    >
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
                formatter={(value: number) => `${(value / 1000).toFixed(0)}k`}
              />
            </Line>
          </LineChart>
    </DashboardChartCard>
  )
}

export default function SalesPage() {
  const salesQuery = useSalesList()
  const analyticsQuery = useSalesAnalytics()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('today')

  const sales = useMemo(
    () => salesQuery.data?.sales ?? [],
    [salesQuery.data?.sales],
  )
  const stats = salesQuery.data?.stats ?? {
    todayTotal: 0,
    weekTotal: 0,
    monthTotal: 0,
    totalSales: 0,
  }
  const analyticsData: AnalyticsData = useMemo(
    () =>
      analyticsQuery.data ?? {
        weeklySales: [],
        paymentBreakdown: [],
        hourlySales: [],
        monthlyComparison: [],
        customerDistribution: [],
        topCategories: [],
      },
    [analyticsQuery.data],
  )
  const loading = salesQuery.isPending

  const filteredSales = useMemo(() => {
    let filtered = sales

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (sale) =>
          sale.customer.toLowerCase().includes(q) ||
          sale.paymentMethod.toLowerCase().includes(q),
      )
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    if (selectedPeriod === 'today') {
      filtered = filtered.filter((sale) => new Date(sale.date) >= today)
    } else if (selectedPeriod === 'week') {
      filtered = filtered.filter((sale) => new Date(sale.date) >= weekAgo)
    } else if (selectedPeriod === 'month') {
      filtered = filtered.filter((sale) => new Date(sale.date) >= monthAgo)
    }

    return filtered
  }, [sales, searchTerm, selectedPeriod])

  if (loading) return <DashboardPageLoading label="Loading sales…" />

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="Sales"
        description="Track sales performance and transactions"
        actions={
          <DashboardToolbar>
            <DashboardButton onClick={() => window.print()}>
              <Download className="h-4 w-4" />
              Export
            </DashboardButton>
            <DashboardButton
              tone="primary"
              onClick={() => { window.location.href = PHARMACY_ROUTES.pos }}
            >
              <Receipt className="h-4 w-4" />
              New sale
            </DashboardButton>
          </DashboardToolbar>
        }
      />

      <DashboardMetricGrid>
        <DashboardStatCard
          label="Today's sales"
          icon={DollarSign}
          value={`${stats.todayTotal.toLocaleString()} RWF`}
          hint="Revenue today"
        />
        <DashboardStatCard
          label="This week"
          icon={TrendingUp}
          value={`${stats.weekTotal.toLocaleString()} RWF`}
          hint="Last 7 days"
        />
        <DashboardStatCard
          label="This month"
          icon={Calendar}
          value={`${stats.monthTotal.toLocaleString()} RWF`}
          hint="Calendar month"
        />
        <DashboardStatCard
          label="Transactions"
          icon={Receipt}
          value={stats.totalSales}
          hint="All time count"
        />
      </DashboardMetricGrid>

      <Tabs defaultValue="overview" className="space-y-4">
        <DashboardTabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </DashboardTabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <WeeklySalesChart data={analyticsData.weeklySales} />
            <HourlySalesChart data={analyticsData.hourlySales} />
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <DashboardSectionCard
              title="Payment methods"
              description="Sales breakdown by payment type"
            >
                <div className="space-y-3">
                  {analyticsData.paymentBreakdown.map((payment, index) => {
                    const icons: Record<string, ReactNode> = {
                      cash: <Banknote className="h-4 w-4 text-green-600" />,
                      mobile_money: <CreditCard className="h-4 w-4 text-blue-600" />,
                      insurance: <Users className="h-4 w-4 text-purple-600" />,
                      card: <CreditCard className="h-4 w-4 text-orange-600" />
                    }
                    const labels: Record<string, string> = {
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
                          <DashboardProgressTrack value={payment.percentage} className="w-20" />
                          <span className="text-sm text-neutral-500">{payment.percentage}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
            </DashboardSectionCard>

            <DashboardSectionCard
              title="Top categories"
              description="Best selling product categories"
            >
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
                        <DashboardProgressTrack value={category.value} className="w-20" />
                        <span className="text-sm text-neutral-500">{category.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
            </DashboardSectionCard>

            <DashboardSectionCard
              title="Recent sales"
              description="Latest transactions"
            >
                <ScrollArea className="h-[200px]">
                  <div className="space-y-3">
                    {sales.slice(0, 5).map((sale) => (
                      <DashboardListRow key={sale.id}>
                        <div>
                          <p className="text-sm font-medium">{sale.customer}</p>
                          <p className="text-xs text-neutral-500">{sale.items} items</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{sale.amount.toLocaleString()} RWF</p>
                          <Badge variant="outline" className="text-xs">{sale.paymentMethod}</Badge>
                        </div>
                      </DashboardListRow>
                    ))}
                  </div>
                </ScrollArea>
            </DashboardSectionCard>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="space-y-4">
          <DashboardTableCard
            title="Sales transactions"
            description="Detailed view of all sales"
            toolbar={
              <>
                <DashboardSearchInput
                  placeholder="Search transactions…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="h-8 w-32 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This week</SelectItem>
                    <SelectItem value="month">This month</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
          >
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
          </DashboardTableCard>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <DashboardChartCard
              title="Sales performance"
              description="Monthly comparison"
              config={{
                current: { label: "Current Month", color: "#3b82f6" },
                previous: { label: "Previous Month", color: "#60a5fa" },
              }}
            >
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
            </DashboardChartCard>
            
            <DashboardSectionCard
              title="Customer distribution"
              description="Sales by customer type"
            >
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
            </DashboardSectionCard>
          </div>
        </TabsContent>
      </Tabs>


    </DashboardPageShell>
  )
}