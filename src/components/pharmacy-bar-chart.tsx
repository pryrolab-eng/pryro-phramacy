"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"

import { DashboardChartCard } from "@/components/dashboard"
import {
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { usePharmacyWeeklySalesChart } from "@/hooks/usePharmacyDashboard"

const chartConfig = {
  prescription: { label: "Prescription", color: "#3b82f6" },
  otc: { label: "OTC Drugs", color: "#60a5fa" },
} satisfies ChartConfig

export function PharmacyBarChart() {
  const chartQuery = usePharmacyWeeklySalesChart()
  const chartData = chartQuery.data ?? []

  return (
    <DashboardChartCard
      title="Weekly sales"
      description="Prescription vs OTC sales comparison"
      config={chartConfig}
      loading={chartQuery.isPending}
      chartClassName="aspect-auto h-[280px]"
    >
      <BarChart accessibilityLayer data={chartData}>
        <XAxis
          dataKey="day"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <Bar
          dataKey="prescription"
          stackId="a"
          fill="var(--color-prescription)"
          radius={[0, 0, 4, 4]}
        />
        <Bar
          dataKey="otc"
          stackId="a"
          fill="var(--color-otc)"
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
