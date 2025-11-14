"use client"

import { useState, useEffect } from "react"
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
  const [chartData, setChartData] = useState([])
  
  useEffect(() => {
    fetch('/api/pharmacy/weekly-sales')
      .then(res => res.json())
      .then(data => setChartData(data))
      .catch(() => setChartData([
        { date: "Mon", prescription: 450, otc: 300 },
        { date: "Tue", prescription: 380, otc: 420 }
      ]))
  }, [])
  
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