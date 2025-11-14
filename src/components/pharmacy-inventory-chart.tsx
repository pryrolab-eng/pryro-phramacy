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
  inStock: {
    label: "In Stock",
    color: "#3b82f6",
  },
  lowStock: {
    label: "Low Stock",
    color: "#60a5fa",
  },
} satisfies ChartConfig

export function PharmacyInventoryChart() {
  const [chartData, setChartData] = useState([])
  
  useEffect(() => {
    fetch('/api/pharmacy/inventory-chart')
      .then(res => res.json())
      .then(data => setChartData(data))
      .catch(() => setChartData([
        { month: "Jan", inStock: 850, lowStock: 45 },
        { month: "Feb", inStock: 920, lowStock: 32 }
      ]))
  }, [])
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Status</CardTitle>
        <CardDescription>
          Monthly inventory levels overview
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
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
        </ChartContainer>
      </CardContent>
    </Card>
  )
}