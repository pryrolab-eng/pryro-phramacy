"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, Line, LineChart, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Spinner } from '@/components/ui/spinner'
import { TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart, RefreshCw, Download } from "lucide-react"

const inventoryData = [
  { date: "2024-04-01", lowStock: 12, expiring: 8, totalItems: 1250 },
  { date: "2024-04-02", lowStock: 15, expiring: 6, totalItems: 1248 },
  { date: "2024-04-03", lowStock: 18, expiring: 9, totalItems: 1245 },
  { date: "2024-04-04", lowStock: 14, expiring: 7, totalItems: 1252 },
  { date: "2024-04-05", lowStock: 11, expiring: 5, totalItems: 1255 },
  { date: "2024-04-06", lowStock: 16, expiring: 12, totalItems: 1249 },
  { date: "2024-04-07", lowStock: 19, expiring: 8, totalItems: 1247 },
  { date: "2024-04-08", lowStock: 13, expiring: 6, totalItems: 1251 },
  { date: "2024-04-09", lowStock: 17, expiring: 10, totalItems: 1246 },
  { date: "2024-04-10", lowStock: 20, expiring: 9, totalItems: 1244 },
  { date: "2024-04-11", lowStock: 22, expiring: 11, totalItems: 1242 },
  { date: "2024-04-12", lowStock: 18, expiring: 7, totalItems: 1248 },
  { date: "2024-04-13", lowStock: 15, expiring: 8, totalItems: 1250 },
  { date: "2024-04-14", lowStock: 21, expiring: 13, totalItems: 1243 },
]

const salesData = [
  { date: "2024-04-01", sales: 45000, orders: 150 },
  { date: "2024-04-02", sales: 52000, orders: 180 },
  { date: "2024-04-03", sales: 38000, orders: 120 },
  { date: "2024-04-04", sales: 67000, orders: 260 },
  { date: "2024-04-05", sales: 73000, orders: 290 },
  { date: "2024-04-06", sales: 61000, orders: 340 },
  { date: "2024-04-07", sales: 55000, orders: 180 },
  { date: "2024-04-08", sales: 89000, orders: 320 },
  { date: "2024-04-09", sales: 29000, orders: 110 },
  { date: "2024-04-10", sales: 71000, orders: 190 },
  { date: "2024-04-11", sales: 87000, orders: 350 },
  { date: "2024-04-12", sales: 62000, orders: 210 },
  { date: "2024-04-13", sales: 92000, orders: 380 },
  { date: "2024-04-14", sales: 47000, orders: 220 },
  { date: "2024-04-15", sales: 40000, orders: 170 },
  { date: "2024-04-16", sales: 48000, orders: 190 },
  { date: "2024-04-17", sales: 96000, orders: 360 },
  { date: "2024-04-18", sales: 84000, orders: 410 },
  { date: "2024-04-19", sales: 63000, orders: 180 },
  { date: "2024-04-20", sales: 39000, orders: 150 },
  { date: "2024-04-21", sales: 47000, orders: 200 },
  { date: "2024-04-22", sales: 64000, orders: 170 },
  { date: "2024-04-23", sales: 48000, orders: 230 },
  { date: "2024-04-24", sales: 87000, orders: 290 },
  { date: "2024-04-25", sales: 65000, orders: 250 },
  { date: "2024-04-26", sales: 35000, orders: 130 },
  { date: "2024-04-27", sales: 93000, orders: 420 },
  { date: "2024-04-28", sales: 42000, orders: 180 },
  { date: "2024-04-29", sales: 75000, orders: 240 },
  { date: "2024-04-30", sales: 94000, orders: 380 },
]

const chartConfig = {
  sales: {
    label: "Sales (RWF)",
    color: "#3b82f6",
  },
  orders: {
    label: "Orders",
    color: "#1d4ed8",
  },
} satisfies ChartConfig

const inventoryConfig = {
  lowStock: {
    label: "Low Stock Items",
    color: "#ef4444",
  },
  expiring: {
    label: "Expiring Soon",
    color: "#f59e0b",
  },
} satisfies ChartConfig

export default function ReportsPage() {
  const [timeRange, setTimeRange] = React.useState("30d")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [reportType, setReportType] = React.useState("all")
  const [reportsData, setReportsData] = React.useState({
    dailySales: [],
    topProducts: [],
    paymentBreakdown: [],
    totalSales: 0,
    totalOrders: 0,
    activeCustomers: 0
  })
  const [inventoryData, setInventoryData] = React.useState([])
  
  React.useEffect(() => {
    fetchReportsData()
    // Real-time updates every 30 seconds
    const interval = setInterval(fetchReportsData, 30000)
    return () => clearInterval(interval)
  }, [])
  
  const fetchReportsData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [salesResponse, inventoryResponse] = await Promise.all([
        fetch('/api/reports/sales'),
        fetch('/api/reports/inventory')
      ])
      
      console.log('Sales API Status:', salesResponse.status)
      console.log('Inventory API Status:', inventoryResponse.status)
      
      if (salesResponse.ok) {
        const salesData = await salesResponse.json()
        console.log('Sales Data:', salesData)
        setReportsData(salesData)
        setLastUpdated(new Date())
      } else if (salesResponse.status === 401) {
        setError('Please log in to view reports')
      } else {
        const error = await salesResponse.json()
        console.error('Sales API Error:', error)
        setError('Failed to load sales data')
      }
      
      if (inventoryResponse.ok) {
        const invData = await inventoryResponse.json()
        console.log('Inventory Data:', invData)
        setInventoryData(invData.inventoryAlerts || [])
      }
    } catch (error) {
      console.error('Error fetching reports data:', error)
      setError('Failed to load reports. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredData = reportsData.dailySales.filter((item) => {
    const date = new Date(item.date)
    const now = new Date()
    let daysToSubtract = 30
    if (timeRange === "7d") {
      daysToSubtract = 7
    } else if (timeRange === "14d") {
      daysToSubtract = 14
    }
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  const totalSales = reportsData.totalSales
  const totalOrders = reportsData.totalOrders
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

  const exportToPDF = () => {
    window.print()
  }

  const applyFilters = () => {
    fetchReportsData()
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-red-500">{error}</p>
      <Button onClick={fetchReportsData}>Retry</Button>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="no-print" />
          <div className="h-4 w-px bg-border no-print" />
          <div>
            <h1 className="text-xl font-bold">Reports & Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Track your pharmacy performance
              {lastUpdated && (
                <span className="ml-2 text-xs">
                  • Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          <Button onClick={exportToPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button onClick={fetchReportsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="text-sm">Filter Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="sales">Sales Only</SelectItem>
                  <SelectItem value="inventory">Inventory Only</SelectItem>
                  <SelectItem value="products">Top Products</SelectItem>
                  <SelectItem value="payments">Payment Methods</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={applyFilters} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {(reportType === "all" || reportType === "sales") && (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales.toLocaleString()} RWF</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12.5% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +8.2% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Avg Order Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgOrderValue).toLocaleString()} RWF</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-blue-500" />
              -2.1% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportsData.activeCustomers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +5.7% from last period
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Sales & Orders Chart */}
      {(reportType === "all" || reportType === "sales") && (
      <Card>
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle className="text-lg">Sales & Orders Analytics</CardTitle>
            <CardDescription>
              Track your pharmacy sales and order trends
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="w-[160px] rounded-lg sm:ml-auto no-print"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="14d" className="rounded-lg">
                Last 14 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {filteredData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <p className="text-sm">No sales data available</p>
                <p className="text-xs mt-1">Make some sales to see analytics</p>
              </div>
            </div>
          ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[300px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-sales)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-sales)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-orders)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-orders)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
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
          </ChartContainer>
          )}
        </CardContent>
      </Card>
      )}

      {/* Inventory Alerts Chart */}
      {(reportType === "all" || reportType === "inventory") && (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventory Alerts</CardTitle>
          <CardDescription>
            Track low stock and expiring items over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          {inventoryData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              <div className="text-center">
                <p className="text-sm">No inventory alerts</p>
                <p className="text-xs mt-1">Add inventory items to track alerts</p>
              </div>
            </div>
          ) : (
          <ChartContainer
            config={inventoryConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <LineChart data={inventoryData.length > 0 ? inventoryData : []}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
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
          </ChartContainer>
          )}
        </CardContent>
      </Card>
      )}

      {/* Additional Reports */}
      {(reportType === "all" || reportType === "products" || reportType === "payments") && (
      <div className="grid gap-6 md:grid-cols-2">
        {(reportType === "all" || reportType === "products") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Selling Products</CardTitle>
            <CardDescription>Best performing items this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportsData.topProducts.length > 0 ? reportsData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.quantity} units sold</p>
                  </div>
                  <Badge variant="outline">{product.sales.toLocaleString()} RWF</Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No sales data available</p>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {(reportType === "all" || reportType === "payments") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payment Methods</CardTitle>
            <CardDescription>Revenue breakdown by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportsData.paymentBreakdown.length > 0 ? reportsData.paymentBreakdown.map((payment, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{payment.method}</span>
                    <span className="text-sm text-muted-foreground">{payment.amount.toLocaleString()} RWF</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${payment.percentage}%` }}
                    ></div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No payment data available</p>
              )}
            </div>
          </CardContent>
        </Card>
        )}
      </div>
      )}
    </div>
  )
}