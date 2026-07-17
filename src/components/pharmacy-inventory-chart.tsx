"use client"

import { Bar, BarChart, XAxis } from "recharts"
import { Package } from "lucide-react"

import { DashboardChartCard, DashboardPanelEmpty } from "@/components/dashboard"
import {
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { usePharmacyInventoryChart } from "@/hooks/usePharmacyDashboard"
import type { InventoryChartPoint } from "@/lib/http/pharmacy-dashboard"

const chartConfig = {
  inStock: { label: "In Stock", color: "#3b82f6" },
  lowStock: { label: "Low Stock", color: "#60a5fa" },
} satisfies ChartConfig

type Props = {
  data?: InventoryChartPoint[]
  loading?: boolean
}

export function PharmacyInventoryChart({ data, loading }: Props = {}) {
  const chartQuery = usePharmacyInventoryChart({
    enabled: data === undefined,
  })
  const chartData = data ?? chartQuery.data ?? []
  const isLoading = data !== undefined ? Boolean(loading) : chartQuery.isPending

  return (
    <DashboardChartCard
      title="Inventory status"
      description="Monthly inventory levels overview"
      config={chartConfig}
      loading={isLoading}
      empty={
        !isLoading && chartData.length === 0 ? (
          <DashboardPanelEmpty
            icon={Package}
            title="No inventory data"
            description="Add inventory items to see stock level trends here."
          />
        ) : undefined
      }
    >
      <BarChart accessibilityLayer data={chartData}>
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <Bar
          dataKey="inStock"
          stackId="a"
          fill="var(--color-inStock)"
          radius={[0, 0, 4, 4]}
        />
        <Bar
          dataKey="lowStock"
          stackId="a"
          fill="var(--color-lowStock)"
          radius={[4, 4, 0, 0]}
        />
        <ChartTooltip
          content={<ChartTooltipContent />}
          cursor={false}
          defaultIndex={1}
        />
      </BarChart>
    </DashboardChartCard>
  )
}
