"use client"

import * as React from "react"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartConfig,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DollarSign,
  Download,
  FileSpreadsheet,
  Package,
  RefreshCw,
  ShoppingCart,
  Users,
} from "lucide-react"
import { FeatureGate } from "@/components/subscription/feature-gate"
import { InsuranceClaimsReportPanel } from "@/components/reports/insurance-claims-report-panel"
import {
  useCombinedReports,
  useInvalidateReports,
} from "@/hooks/useReports"
import { useBranchReportScope } from "@/hooks/useBranchReportScope"
import type { BranchScopeQuery } from "@/lib/pharmacy/branch-scope"
import {
  DashboardPageShell,
  DashboardPageHeader,
  DashboardToolbar,
  DashboardButton,
  DashboardFilterBar,
  DashboardFilterField,
  DashboardMetricGrid,
  DashboardStatCard,
  DashboardChartCard,
  DashboardSectionCard,
  DashboardListRow,
  DashboardProgressTrack,
  DashboardPageLoading,
  DashboardPageError,
  DashboardPanelEmpty,
} from "@/components/dashboard"
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths"
import { exportReportsPdf, exportReportsExcel } from "@/lib/reports/export-reports"

const chartConfig = {
  sales: { label: "Sales (RWF)", color: "#3b82f6" },
  orders: { label: "Orders", color: "#1d4ed8" },
} satisfies ChartConfig

const inventoryConfig = {
  lowStock: { label: "Low Stock Items", color: "#ef4444" },
  expiring: { label: "Expiring Soon", color: "#f59e0b" },
} satisfies ChartConfig

interface DailySale {
  date: string
  sales?: number
  orders?: number
}

interface TopProduct {
  name: string
  quantity: number
  sales: number
}

interface PaymentBreakdownItem {
  method: string
  amount: number
  percentage: number
}

interface ReportsData {
  dailySales: DailySale[]
  topProducts: TopProduct[]
  paymentBreakdown: PaymentBreakdownItem[]
  totalSales: number
  totalOrders: number
  activeCustomers: number
}

interface InventoryAlert {
  date: string
  lowStock?: number
  expiring?: number
  totalItems?: number
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<DashboardPageLoading label="Loading reports…" />}>
      <ReportsPageInner />
    </Suspense>
  )
}

function ReportsPageInner() {
  const searchParams = useSearchParams()
  const [timeRange, setTimeRange] = React.useState("30d")
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [reportType, setReportType] = React.useState(
    () => searchParams.get("type") === "insurance" ? "insurance" : "all",
  )

  React.useEffect(() => {
    if (searchParams.get("type") === "insurance") {
      setReportType("insurance")
    }
  }, [searchParams])
  const { branchScope, setBranchScope, scopeQuery: baseScopeQuery } =
    useBranchReportScope({ defaultDays: 30 })

  const scopeQuery: BranchScopeQuery = React.useMemo(() => {
    if (startDate && endDate) {
      const to = new Date(endDate)
      to.setHours(23, 59, 59, 999)
      return {
        ...baseScopeQuery,
        from: new Date(startDate).toISOString(),
        to: to.toISOString(),
      }
    }
    let days = 30
    if (timeRange === "7d") days = 7
    else if (timeRange === "14d") days = 14
    const to = new Date()
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    return { ...baseScopeQuery, from: from.toISOString(), to: to.toISOString() }
  }, [baseScopeQuery, startDate, endDate, timeRange])

  const combinedReportsQuery = useCombinedReports({
    scope: scopeQuery,
    enabled: reportType !== "insurance",
  })
  const invalidateReports = useInvalidateReports()

  const reportsData: ReportsData =
    combinedReportsQuery.data?.salesReport ?? {
      dailySales: [],
      topProducts: [],
      paymentBreakdown: [],
      totalSales: 0,
      totalOrders: 0,
      activeCustomers: 0,
    }
  const inventoryData: InventoryAlert[] =
    combinedReportsQuery.data?.inventoryReport?.inventoryAlerts ?? []

  React.useEffect(() => {
    if (combinedReportsQuery.isSuccess) {
      setLastUpdated(new Date())
      setError(null)
    }
    if (combinedReportsQuery.isError) {
      setError("Failed to load reports. Please try again.")
    }
  }, [combinedReportsQuery.isSuccess, combinedReportsQuery.isError])

  const loading =
    reportType === "insurance"
      ? false
      : combinedReportsQuery.isPending && !combinedReportsQuery.data

  const fetchReportsData = () => {
    void invalidateReports()
  }

  const filteredData = reportsData.dailySales.filter((item) => {
    const date = new Date(item.date)
    const now = new Date()
    let daysToSubtract = 30
    if (timeRange === "7d") daysToSubtract = 7
    else if (timeRange === "14d") daysToSubtract = 14
    const start = new Date(now)
    start.setDate(start.getDate() - daysToSubtract)
    return date >= start
  })

  const totalSales = reportsData.totalSales
  const totalOrders = reportsData.totalOrders
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

  if (loading) return <DashboardPageLoading label="Loading reports…" />

  if (error && reportType !== "insurance") {
    return (
      <DashboardPageError message={error} onRetry={fetchReportsData} />
    )
  }

  const showSales = reportType === "all" || reportType === "sales"
  const showInventory = reportType === "all" || reportType === "inventory"
  const showProducts = reportType === "all" || reportType === "products"
  const showPayments = reportType === "all" || reportType === "payments"
  const showInsurance = reportType === "insurance"

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        title="Reports & analytics"
        description={
          <>
            Track pharmacy performance
            {lastUpdated ? (
              <span className="ml-2 text-xs text-neutral-400">
                · Updated {lastUpdated.toLocaleTimeString()}
              </span>
            ) : null}
          </>
        }
        actions={
          <DashboardToolbar>
            <DashboardButton onClick={() => exportReportsPdf(reportsData, inventoryData, { startDate, endDate })}>
              <Download className="h-4 w-4" />
              PDF
            </DashboardButton>
            <DashboardButton onClick={() => exportReportsExcel(reportsData, inventoryData)}>
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </DashboardButton>
            <DashboardButton onClick={fetchReportsData}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </DashboardButton>
          </DashboardToolbar>
        }
      />

      <DashboardFilterBar description="Scope metrics and charts by branch and date range">
        <DashboardFilterField label="Report type">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="h-8 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All reports</SelectItem>
              <SelectItem value="sales">Sales only</SelectItem>
              <SelectItem value="inventory">Inventory only</SelectItem>
              <SelectItem value="products">Top products</SelectItem>
              <SelectItem value="payments">Payment methods</SelectItem>
              <SelectItem value="insurance">Insurance claims</SelectItem>
            </SelectContent>
          </Select>
        </DashboardFilterField>
        <DashboardFilterField label="Start date">
          <Input
            type="date"
            className="h-8 rounded-lg"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </DashboardFilterField>
        <DashboardFilterField label="End date">
          <Input
            type="date"
            className="h-8 rounded-lg"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </DashboardFilterField>
        <DashboardFilterField label=" " className="flex items-end">
          <DashboardButton tone="primary" className="w-full" onClick={fetchReportsData}>
            Apply filters
          </DashboardButton>
        </DashboardFilterField>
      </DashboardFilterBar>

      {showSales ? (
        <DashboardMetricGrid>
          <DashboardStatCard
            label="Total sales"
            icon={DollarSign}
            value={`${totalSales.toLocaleString()} RWF`}
            hint="Selected period"
          />
          <DashboardStatCard
            label="Total orders"
            icon={ShoppingCart}
            value={totalOrders}
            hint="Completed transactions"
          />
          <DashboardStatCard
            label="Avg order value"
            icon={Package}
            value={`${Math.round(avgOrderValue).toLocaleString()} RWF`}
            hint="Per order"
          />
          <DashboardStatCard
            label="Active customers"
            icon={Users}
            value={reportsData.activeCustomers}
            hint="Unique buyers"
          />
        </DashboardMetricGrid>
      ) : null}

      {showSales ? (
        <DashboardChartCard
          title="Sales & orders"
          description="Revenue and order volume over time"
          config={chartConfig}
          action={
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-8 w-[140px] rounded-lg no-print">
                <SelectValue placeholder="Last 30 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="14d">Last 14 days</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
              </SelectContent>
            </Select>
          }
          chartClassName="aspect-auto h-[300px] w-full"
          empty={
            filteredData.length === 0 ? (
              <DashboardPanelEmpty
                icon={ShoppingCart}
                title="No sales data"
                description="Complete sales at the POS to see trends here."
                actionLabel="Open POS"
                actionHref={PHARMACY_ROUTES.pos}
              />
            ) : undefined
          }
        >
          <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-orders)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-orders)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="orders"
                type="natural"
                fill="url(#fillOrders)"
                stroke="var(--color-orders)"
                stackId="a"
              />
              <Area
                dataKey="sales"
                type="natural"
                fill="url(#fillSales)"
                stroke="var(--color-sales)"
                stackId="a"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </AreaChart>
        </DashboardChartCard>
      ) : null}

      {showInventory ? (
        <DashboardChartCard
          title="Inventory alerts"
          description="Low stock and expiring items over time"
          config={inventoryConfig}
          chartClassName="aspect-auto h-[250px] w-full"
          empty={
            inventoryData.length === 0 ? (
              <DashboardPanelEmpty
                icon={Package}
                title="No alert history"
                description="Add inventory with expiry dates to track alerts."
                actionLabel="Inventory"
                actionHref={PHARMACY_ROUTES.inventory}
              />
            ) : undefined
          }
        >
          <LineChart data={inventoryData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Line
                dataKey="lowStock"
                type="monotone"
                stroke="var(--color-lowStock)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                dataKey="expiring"
                type="monotone"
                stroke="var(--color-expiring)"
                strokeWidth={2}
                dot={false}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </LineChart>
        </DashboardChartCard>
      ) : null}

      {showProducts || showPayments ? (
        <div className="grid gap-6 md:grid-cols-2">
          {showProducts ? (
            <DashboardSectionCard
              title="Top selling products"
              description="Best performers in the selected period"
            >
              <div className="space-y-3">
                {reportsData.topProducts.length > 0 ? (
                  reportsData.topProducts.map((product, index) => (
                    <DashboardListRow key={index}>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-neutral-500">
                          {product.quantity} units sold
                        </p>
                      </div>
                      <Badge variant="outline">
                        {product.sales.toLocaleString()} RWF
                      </Badge>
                    </DashboardListRow>
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-neutral-500">
                    No product sales in this period
                  </p>
                )}
              </div>
            </DashboardSectionCard>
          ) : null}

          {showPayments ? (
            <DashboardSectionCard
              title="Payment methods"
              description="Revenue breakdown by payment type"
            >
              <div className="space-y-4">
                {reportsData.paymentBreakdown.length > 0 ? (
                  reportsData.paymentBreakdown.map((payment, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{payment.method}</span>
                        <span className="text-neutral-500">
                          {payment.amount.toLocaleString()} RWF
                        </span>
                      </div>
                      <DashboardProgressTrack value={payment.percentage} />
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-neutral-500">
                    No payment data in this period
                  </p>
                )}
              </div>
            </DashboardSectionCard>
          ) : null}
        </div>
      ) : null}

      {showInsurance ? (
        <FeatureGate
          featureKey="pos.insurance"
          compact={false}
          loadingFallback={
            <DashboardPageLoading label="Loading insurance report…" />
          }
        >
          <InsuranceClaimsReportPanel />
        </FeatureGate>
      ) : null}
    </DashboardPageShell>
  )
}
