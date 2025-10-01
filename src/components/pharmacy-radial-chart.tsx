"use client"

import { TrendingUp } from "lucide-react"
import { LabelList, RadialBar, RadialBarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { category: "prescription", sales: 275, fill: "var(--color-prescription)" },
  { category: "otc", sales: 200, fill: "var(--color-otc)" },
  { category: "supplements", sales: 187, fill: "var(--color-supplements)" },
  { category: "medical", sales: 173, fill: "var(--color-medical)" },
  { category: "other", sales: 90, fill: "var(--color-other)" },
]

const chartConfig = {
  sales: {
    label: "Sales",
  },
  prescription: {
    label: "Prescription",
    color: "#60a5fa",
  },
  otc: {
    label: "OTC Drugs",
    color: "#3b82f6",
  },
  supplements: {
    label: "Supplements",
    color: "#2563eb",
  },
  medical: {
    label: "Medical Devices",
    color: "#1d4ed8",
  },
  other: {
    label: "Other",
    color: "#1e40af",
  },
} satisfies ChartConfig

export function PharmacyRadialChart() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Sales by Category</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
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
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total sales for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}