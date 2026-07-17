"use client"

import { TrendingUp } from "lucide-react"
import { LabelList, RadialBar, RadialBarChart } from "recharts"

import { DashboardChartCard } from "@/components/dashboard"
import {
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { usePharmacyCategorySalesChart } from "@/hooks/usePharmacyDashboard"
import type { CategorySalesChartPoint } from "@/lib/http/pharmacy-dashboard"

const chartConfig = {
  sales: { label: "Sales" },
  prescription: { label: "Prescription", color: "#60a5fa" },
  otc: { label: "OTC Drugs", color: "#3b82f6" },
  supplements: { label: "Supplements", color: "#2563eb" },
  medical: { label: "Medical Devices", color: "#1d4ed8" },
  other: { label: "Other", color: "#1e40af" },
} satisfies ChartConfig

type Props = {
  /** When provided (e.g. from combined dashboard), skip a separate fetch. */
  data?: CategorySalesChartPoint[]
  loading?: boolean
}

export function PharmacyRadialChart({ data, loading }: Props = {}) {
  const chartQuery = usePharmacyCategorySalesChart({
    enabled: data === undefined,
  })
  const chartData = data ?? chartQuery.data ?? []
  const isLoading = data !== undefined ? Boolean(loading) : chartQuery.isPending

  return (
    <DashboardChartCard
      title="Sales by category"
      description="Category mix from your sales"
      config={chartConfig}
      loading={isLoading}
      className="flex flex-col"
      chartClassName="mx-auto aspect-square max-h-[250px]"
      footer={
        <>
          <div className="flex items-center gap-2 font-medium leading-none">
            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-muted-foreground text-xs leading-none">
            Showing total sales for the last 6 months
          </p>
        </>
      }
    >
      <RadialBarChart
        data={chartData}
        startAngle={-90}
        endAngle={380}
        innerRadius={30}
        outerRadius={110}
      >
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="category" />}
        />
        <RadialBar dataKey="sales" background>
          <LabelList
            position="insideStart"
            dataKey="category"
            className="fill-white capitalize mix-blend-luminosity"
            fontSize={11}
          />
        </RadialBar>
      </RadialBarChart>
    </DashboardChartCard>
  )
}
