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
  DashboardPanelEmpty,
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
  monthlyComparison: Array<{ week?: string; current: number; previous: number }>
  customerDistribution: Array<{ name: string; value: number; fill?: string }>
  topCategories: Array<{ name: string; value: number; color: string }>
}

function WeeklySalesChart({ data }: { data: Array<{ day?: string; sales: number }> }) {
  const hasSales = data.some((point) => point.sales > 0)

  return (
    <DashboardChartCard
      title="Weekly sales trend"
      description="Daily sales performance over the past week"
      config={weeklyChartConfig}
      chartClassName="h-64"
    >
      {!hasSales ? (
        <DashboardPanelEmpty
          icon={TrendingUp}
          title="No weekly sales yet"
          description="Complete POS sales to populate this trend."
          className="h-full border-0 bg-transparent shadow-none"
        />
      ) : (
          <LineChart
            accessibilityLayer
            data={data}
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
      )}
    </DashboardChartCard>
  )
}

function HourlySalesChart({ data }: { data: Array<{ hour?: string; sales: number }> }) {
  const hasSales = data.some((point) => point.sales > 0)

  return (
    <DashboardChartCard
      title="Today's hourly sales"
      description="Sales performance throughout the day"
      config={hourlyChartConfig}
      chartClassName="h-64"
    >
      {!hasSales ? (
        <DashboardPanelEmpty
          icon={TrendingUp}
          title="No hourly sales yet"
          description="Today's POS sales will appear here as they are completed."
          className="h-full border-0 bg-transparent shadow-none"
        />
      ) : (
          <LineChart
            accessibilityLayer
            data={data}
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
      )}
    </DashboardChartCard>
  )
}

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState<
    'today' | 'week' | 'month' | 'all'
  >('today')

  const salesQuery = useSalesList({
    period: selectedPeriod,
    q: searchTerm.trim() || undefined,
    limit: selectedPeriod === 'all' ? 200 : 100,
  })
  const analyticsQuery = useSalesAnalytics()

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

  const filteredSales = sales

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
                  {analyticsData.topCategories.length === 0 ? (
                    <DashboardPanelEmpty
                      icon={ShoppingCart}
                      title="No category sales"
                      description="Category percentages are calculated from sold items."
                      className="min-h-[160px] border-0 bg-transparent shadow-none"
                    />
                  ) : analyticsData.topCategories.map((category, index) => (
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
                <Select
                  value={selectedPeriod}
                  onValueChange={(value) =>
                    setSelectedPeriod(
                      value as 'today' | 'week' | 'month' | 'all',
                    )
                  }
                >
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
              {analyticsData.monthlyComparison.every(
                (point) => point.current === 0 && point.previous === 0,
              ) ? (
                <DashboardPanelEmpty
                  icon={TrendingUp}
                  title="No monthly comparison"
                  description="Current and previous month sales will appear here."
                  className="h-full border-0 bg-transparent shadow-none"
                />
              ) : (
                  <BarChart data={analyticsData.monthlyComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="current" fill="#3b82f6" radius={4} />
                    <Bar dataKey="previous" fill="#60a5fa" radius={4} />
                  </BarChart>
              )}
            </DashboardChartCard>
            
            <DashboardSectionCard
              title="Customer distribution"
              description="Sales by customer type"
            >
                {analyticsData.customerDistribution.length === 0 ? (
                  <DashboardPanelEmpty
                    icon={Users}
                    title="No customer mix yet"
                    description="Distribution is calculated from real sales."
                    className="min-h-[240px] border-0 bg-transparent shadow-none"
                  />
                ) : (
                <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.customerDistribution}
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
                  {analyticsData.customerDistribution.map((row) => (
                    <div key={row.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded"
                        style={{ backgroundColor: row.fill ?? '#737373' }}
                      />
                      <span>{row.name} Customers ({row.value}%)</span>
                    </div>
                  ))}
                </div>
                </>
                )}
            </DashboardSectionCard>
          </div>
        </TabsContent>
      </Tabs>


    </DashboardPageShell>
  )
}
