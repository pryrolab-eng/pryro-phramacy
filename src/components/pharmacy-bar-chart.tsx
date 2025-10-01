"use client"

import { Bar, BarChart, XAxis } from "recharts"

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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { date: "2024-07-15", prescription: 450, otc: 300 },
  { date: "2024-07-16", prescription: 380, otc: 420 },
  { date: "2024-07-17", prescription: 520, otc: 120 },
  { date: "2024-07-18", prescription: 140, otc: 550 },
  { date: "2024-07-19", prescription: 600, otc: 350 },
  { date: "2024-07-20", prescription: 480, otc: 400 },
]

const chartConfig = {
  prescription: {
    label: "Prescription",
    color: "#3b82f6",
  },
  otc: {
    label: "OTC Drugs",
    color: "#60a5fa",
  },
} satisfies ChartConfig

export function PharmacyBarChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Sales</CardTitle>
        <CardDescription>
          Prescription vs OTC sales comparison
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", {
                  weekday: "short",
                })
              }}
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
        </ChartContainer>
      </CardContent>
    </Card>
  )
}