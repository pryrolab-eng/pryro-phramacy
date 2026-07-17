'use client'

import { PHARMACY_ROUTES } from '@/lib/routes/pharmacy-paths'

import { useState, useMemo, useCallback, type ReactNode } from 'react'
import { useSalesAnalytics, useSalesList } from '@/hooks/useSales'
import { useLocalListSearch } from '@/hooks/useLocalListSearch'
import { filterSalesForSearch } from '@/lib/sales/search-sales'
import { PRYROX_BRAND_BLUE, PRYROX_BRAND_BLUE_LIGHT, PRYROX_CUSTOMER_CHART_COLORS } from '@/lib/brand/colors'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Receipt, DollarSign, TrendingUp, Calendar, Search, Filter, Download, ArrowUpRight, ArrowDownRight, Users, ShoppingCart, CreditCard, Banknote } from 'lucide-react'
import { AreaChart, Area, PieChart, Pie, CartesianGrid, LabelList, XAxis, YAxis, BarChart, Bar } from 'recharts'
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
  DashboardPaginatedListCard,
  DashboardPanelEmpty,
} from '@/components/dashboard'
import {
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const PAYMENT_METHOD_ICONS: Record<string, ReactNode> = {
  cash: <Banknote className="h-4 w-4 text-green-600" />,
  mobile_money: <CreditCard className="h-4 w-4 text-blue-600" />,
  insurance: <Users className="h-4 w-4 text-purple-600" />,
  card: <CreditCard className="h-4 w-4 text-orange-600" />,
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  mobile_money: 'Mobile Money',
  insurance: 'Insurance',
  card: 'Card',
}

function paymentMethodLabel(method: string) {
  return PAYMENT_METHOD_LABELS[method] ?? method.replace(/_/g, ' ')
}

/** Compact peak labels on area charts — avoids rounding 1,600 RWF up to "2k". */
function formatSalesChartLabel(value: number): string {
  if (value >= 10_000) {
    return `${Math.round(value / 1000)}k`
  }
  if (value >= 1_000) {
    const thousands = Math.round((value / 1000) * 10) / 10
    return Number.isInteger(thousands) ? `${thousands}k` : `${thousands.toFixed(1)}k`
  }
  return value.toLocaleString()
}

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

const monthlyComparisonChartConfig = {
  current: {
    label: "Current month",
    color: PRYROX_BRAND_BLUE,
  },
  previous: {
    label: "Previous month",
    color: PRYROX_BRAND_BLUE_LIGHT,
  },
} satisfies ChartConfig

const CUSTOMER_SEGMENT_KEY = {
  "Walk-in": "walkIn",
  Regular: "regular",
  Insurance: "insurance",
} as const

type CustomerSegmentKey =
  (typeof CUSTOMER_SEGMENT_KEY)[keyof typeof CUSTOMER_SEGMENT_KEY]

const customerDistributionChartConfig = {
  share: {
    label: "Share",
  },
  walkIn: {
    label: "Walk-in payer",
    color: PRYROX_CUSTOMER_CHART_COLORS.walkIn,
  },
  regular: {
    label: "Registered payer",
    color: PRYROX_CUSTOMER_CHART_COLORS.regular,
  },
  insurance: {
    label: "Insurance",
    color: PRYROX_CUSTOMER_CHART_COLORS.insurance,
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

function WeeklySalesChart({ data, loading }: { data: Array<{ day?: string; sales: number }>; loading?: boolean }) {
  const hasSales = data.some((point) => point.sales > 0)

  return (
    <DashboardChartCard
      title="Weekly sales trend"
      description="Daily sales performance over the past week"
      config={weeklyChartConfig}
      chartClassName="h-64"
      loading={loading}
    >
      {!hasSales ? (
        <DashboardPanelEmpty
          icon={TrendingUp}
          title="No weekly sales yet"
          description="Complete POS sales to populate this trend."
          className="h-full border-0 bg-transparent shadow-none"
        />
      ) : (
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
              left: 12,
              right: 12,
            }}
          >
            <defs>
              <linearGradient id="fillWeeklySales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <YAxis hide domain={[0, "auto"]} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="sales"
              type="monotone"
              fill="url(#fillWeeklySales)"
              stroke="var(--color-sales)"
              strokeWidth={2}
              baseValue={0}
              connectNulls
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
                formatter={(value: number) => formatSalesChartLabel(value)}
              />
            </Area>
          </AreaChart>
      )}
    </DashboardChartCard>
  )
}

function HourlySalesChart({ data, loading }: { data: Array<{ hour?: string; sales: number }>; loading?: boolean }) {
  const hasSales = data.some((point) => point.sales > 0)

  return (
    <DashboardChartCard
      title="Today's hourly sales"
      description="Sales performance throughout the day"
      config={hourlyChartConfig}
      chartClassName="h-64"
      loading={loading}
    >
      {!hasSales ? (
        <DashboardPanelEmpty
          icon={TrendingUp}
          title="No hourly sales yet"
          description="Today's POS sales will appear here as they are completed."
          className="h-full border-0 bg-transparent shadow-none"
        />
      ) : (
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              top: 20,
              left: 12,
              right: 12,
            }}
          >
            <defs>
              <linearGradient id="fillHourlySales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <YAxis hide domain={[0, "auto"]} />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="sales"
              type="monotone"
              fill="url(#fillHourlySales)"
              stroke="var(--color-sales)"
              strokeWidth={2}
              baseValue={0}
              connectNulls
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
                formatter={(value: number) => formatSalesChartLabel(value)}
              />
            </Area>
          </AreaChart>
      )}
    </DashboardChartCard>
  )
}

function MonthlyComparisonChart({
  data,
  loading,
}: {
  data: Array<{ week?: string; current: number; previous: number }>
  loading?: boolean
}) {
  const hasData = data.some((point) => point.current > 0 || point.previous > 0)

  const totals = useMemo(() => {
    const current = data.reduce((sum, row) => sum + row.current, 0)
    const previous = data.reduce((sum, row) => sum + row.previous, 0)
    const changePct =
      previous > 0 ? ((current - previous) / previous) * 100 : null
    return { current, previous, changePct }
  }, [data])

  const footer = hasData ? (
    <>
      <div className="flex items-center gap-2 leading-none font-medium">
        {totals.changePct === null ? (
          <span>New sales this month — no prior-month baseline</span>
        ) : totals.changePct >= 0 ? (
          <>
            <span>Up {Math.abs(totals.changePct).toFixed(1)}% vs last month</span>
            <ArrowUpRight className="h-4 w-4 shrink-0" />
          </>
        ) : (
          <>
            <span>Down {Math.abs(totals.changePct).toFixed(1)}% vs last month</span>
            <ArrowDownRight className="h-4 w-4 shrink-0" />
          </>
        )}
      </div>
      <p className="leading-none text-muted-foreground">
        {totals.current.toLocaleString()} RWF this month ·{" "}
        {totals.previous.toLocaleString()} RWF last month
      </p>
    </>
  ) : undefined

  return (
    <DashboardChartCard
      title="Sales performance"
      description="Current vs previous month by week"
      config={monthlyComparisonChartConfig}
      chartClassName="aspect-auto h-[280px] w-full"
      footer={footer}
      loading={loading}
      empty={
        !hasData ? (
          <DashboardPanelEmpty
            icon={TrendingUp}
            title="No monthly comparison"
            description="Current and previous month sales will appear here."
            className="h-full border-0 bg-transparent shadow-none"
          />
        ) : undefined
      }
    >
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="week"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => String(value).replace("Week ", "W")}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="dashed"
              formatter={(value) => [`${Number(value).toLocaleString()} RWF`]}
            />
          }
        />
        <Bar dataKey="current" fill="var(--color-current)" radius={4} />
        <Bar dataKey="previous" fill="var(--color-previous)" radius={4} />
      </BarChart>
    </DashboardChartCard>
  )
}

function CustomerDistributionChart({
  data,
  loading,
}: {
  data: Array<{ name: string; value: number; fill?: string }>
  loading?: boolean
}) {
  const hasData = data.some((row) => row.value > 0)

  const pieData = useMemo(
    () =>
      data
        .map((row) => {
          const segment =
            CUSTOMER_SEGMENT_KEY[row.name as keyof typeof CUSTOMER_SEGMENT_KEY]
          if (!segment) return null
          return {
            segment,
            share: row.value,
            fill: `var(--color-${segment})`,
          }
        })
        .filter(
          (row): row is { segment: CustomerSegmentKey; share: number; fill: string } =>
            row !== null && row.share > 0,
        ),
    [data],
  )

  const footer = data.length > 0 ? (
    <div className="grid gap-2">
      {data.map((row) => {
        const segment =
          CUSTOMER_SEGMENT_KEY[row.name as keyof typeof CUSTOMER_SEGMENT_KEY]
        if (!segment) return null
        return (
          <div key={row.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: `var(--color-${segment})` }}
            />
            <span className="text-muted-foreground">
              {customerDistributionChartConfig[segment].label} ({row.value}%)
            </span>
          </div>
        )
      })}
    </div>
  ) : undefined

  return (
    <DashboardChartCard
      title="Customer distribution"
      description="Sales by customer type"
      config={customerDistributionChartConfig}
      chartClassName="mx-auto aspect-square max-h-[220px] w-full"
      footer={footer}
      loading={loading}
      empty={
        !hasData ? (
          <DashboardPanelEmpty
            icon={Users}
            title="No customer mix yet"
            description="Distribution is calculated from real sales."
            className="min-h-[240px] border-0 bg-transparent shadow-none"
          />
        ) : undefined
      }
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              nameKey="segment"
              formatter={(value, name) => {
                const segment = String(name) as CustomerSegmentKey
                const label =
                  customerDistributionChartConfig[segment]?.label ?? name
                return [`${value}%`, label]
              }}
            />
          }
        />
        <Pie
          data={pieData}
          dataKey="share"
          nameKey="segment"
          innerRadius={56}
          outerRadius={80}
          strokeWidth={4}
          stroke="hsl(var(--background))"
        />
      </PieChart>
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
    limit: selectedPeriod === 'all' ? 200 : 100,
  })
  const analyticsQuery = useSalesAnalytics()
  const filterSales = useCallback(
    (rows: Sale[], q: string) => filterSalesForSearch(rows, q),
    [],
  )
  const { filtered: filteredSales } = useLocalListSearch(
    searchTerm,
    salesQuery.data?.sales,
    filterSales,
  )

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
          loading={salesQuery.isPending}
        />
        <DashboardStatCard
          label="This week"
          icon={TrendingUp}
          value={`${stats.weekTotal.toLocaleString()} RWF`}
          hint="Last 7 days"
          loading={salesQuery.isPending}
        />
        <DashboardStatCard
          label="This month"
          icon={Calendar}
          value={`${stats.monthTotal.toLocaleString()} RWF`}
          hint="Calendar month"
          loading={salesQuery.isPending}
        />
        <DashboardStatCard
          label="Transactions"
          icon={Receipt}
          value={stats.totalSales}
          hint="All time count"
          loading={salesQuery.isPending}
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
            <WeeklySalesChart data={analyticsData.weeklySales} loading={analyticsQuery.isPending} />
            <HourlySalesChart data={analyticsData.hourlySales} loading={analyticsQuery.isPending} />
          </div>
          
          <div className="grid gap-6 md:grid-cols-3 md:items-start">
            <DashboardPaginatedListCard
              title="Payment methods"
              description="Sales breakdown by payment type"
              items={analyticsData.paymentBreakdown}
              getItemKey={(payment) => payment.method}
              empty={{
                icon: CreditCard,
                title: "No payment data",
                description: "Complete sales to see payment mix.",
              }}
              renderItem={(payment) => (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    {PAYMENT_METHOD_ICONS[payment.method] ?? (
                      <CreditCard className="h-4 w-4 shrink-0 text-neutral-500" />
                    )}
                    <span className="truncate text-sm font-medium">
                      {paymentMethodLabel(payment.method)}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <DashboardProgressTrack
                      value={payment.percentage}
                      className="w-20 shrink-0"
                    />
                    <span className="w-10 text-right text-sm tabular-nums text-neutral-500">
                      {payment.percentage}%
                    </span>
                  </div>
                </div>
              )}
            />

            <DashboardPaginatedListCard
              title="Top categories"
              description="Best selling product categories"
              items={analyticsData.topCategories}
              getItemKey={(category) => category.name}
              empty={{
                icon: ShoppingCart,
                title: "No category sales",
                description: "Category percentages are calculated from sold items.",
              }}
              renderItem={(category) => (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className={cn("h-3 w-3 shrink-0 rounded-full", category.color)}
                    />
                    <span className="truncate text-sm font-medium">{category.name}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <DashboardProgressTrack
                      value={category.value}
                      className="w-20 shrink-0"
                    />
                    <span className="w-10 text-right text-sm tabular-nums text-neutral-500">
                      {category.value}%
                    </span>
                  </div>
                </div>
              )}
            />

            <DashboardPaginatedListCard
              title="Recent sales"
              description="Latest transactions"
              items={sales}
              getItemKey={(sale) => sale.id}
              pageSize={6}
              pageSizeOptions={[6, 10, 15]}
              scrollAfterRows={7}
              empty={{
                icon: Receipt,
                title: "No sales yet",
                description: "Completed POS sales will appear here.",
              }}
              renderItem={(sale) => (
                <DashboardListRow>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{sale.customer}</p>
                    <p className="text-xs text-neutral-500">
                      {sale.items} item{sale.items === 1 ? '' : 's'} ·{' '}
                      {new Date(sale.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {sale.amount.toLocaleString()} RWF
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {sale.paymentMethod}
                    </Badge>
                  </div>
                </DashboardListRow>
              )}
            />
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
                        <Badge
                          variant={
                            sale.status === 'completed'
                              ? 'success'
                              : sale.status === 'failed' || sale.status === 'cancelled'
                                ? 'danger'
                                : 'warning'
                          }
                          className="capitalize"
                        >
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
            <MonthlyComparisonChart data={analyticsData.monthlyComparison} loading={analyticsQuery.isPending} />
            <CustomerDistributionChart data={analyticsData.customerDistribution} loading={analyticsQuery.isPending} />
          </div>
        </TabsContent>
      </Tabs>


    </DashboardPageShell>
  )
}
