"use client"

import { Bar, BarChart, XAxis } from "recharts"

import { DashboardChartCard } from "@/components/dashboard"
import {
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { usePharmacyInventoryChart } from "@/hooks/usePharmacyDashboard"

const chartConfig = {
  inStock: { label: "In Stock", color: "#3b82f6" },
  lowStock: { label: "Low Stock", color: "#60a5fa" },
} satisfies ChartConfig

export function PharmacyInventoryChart() {
  const chartQuery = usePharmacyInventoryChart()
  const chartData = chartQuery.data ?? []

  return (
    <DashboardChartCard
      title="Inventory status"
      description="Monthly inventory levels overview"
      config={chartConfig}
      loading={chartQuery.isPending}
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
