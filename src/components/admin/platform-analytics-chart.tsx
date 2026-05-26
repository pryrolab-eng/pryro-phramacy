'use client'

import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'

import { Button } from '@/components/ui/button'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { PlatformChartPoint } from '@/lib/admin/chart-series'
import { cn } from '@/lib/utils'

type ChartMetric = 'revenue' | 'pharmacies' | 'both'
type ChartRange = '6' | '12'

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
  pharmacies: {
    label: 'Pharmacies',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

function formatRwf(value: number) {
  if (value >= 1_000_000) return `RWF ${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `RWF ${(value / 1_000).toFixed(1)}K`
  return `RWF ${value.toLocaleString()}`
}

type PlatformAnalyticsChartProps = {
  data: PlatformChartPoint[]
  hasPaymentHistory: boolean
  /** `area` matches the dashboard default; `line` uses stroke-only lines (reports page). */
  variant?: 'area' | 'line'
  className?: string
}

export function PlatformAnalyticsChart({
  data,
  hasPaymentHistory,
  variant = 'area',
  className,
}: PlatformAnalyticsChartProps) {
  const [range, setRange] = useState<ChartRange>('6')
  const [metric, setMetric] = useState<ChartMetric>('both')

  const visibleData = useMemo(() => {
    const count = range === '6' ? 6 : 12
    return data.slice(-count)
  }, [data, range])

  const showBrush = range === '12' && visibleData.length > 6

  const description = hasPaymentHistory
    ? 'Revenue from completed payments. Drag the brush to focus a period.'
    : 'No payments yet — pharmacy bars show new sign-ups per month.'

  const useLine = variant === 'line'

  const revenueSeries =
    metric === 'pharmacies' ? null : useLine ? (
      <Line
        yAxisId="revenue"
        type="monotone"
        dataKey="revenue"
        stroke="var(--color-revenue)"
        strokeWidth={2}
        dot={{ r: 3, fill: 'var(--color-revenue)' }}
        activeDot={{ r: 5 }}
      />
    ) : (
      <Area
        yAxisId="revenue"
        type="monotone"
        dataKey="revenue"
        stroke="var(--color-revenue)"
        fill="url(#adminFillRevenue)"
        strokeWidth={2}
        dot={{ r: 3, fill: 'var(--color-revenue)' }}
        activeDot={{ r: 5 }}
      />
    )

  const pharmaciesSeries =
    metric === 'both' ? (
      useLine ? (
        <Line
          yAxisId="pharmacies"
          type="monotone"
          dataKey="pharmacies"
          stroke="var(--color-pharmacies)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--color-pharmacies)' }}
          activeDot={{ r: 5 }}
        />
      ) : (
        <Area
          yAxisId="pharmacies"
          type="monotone"
          dataKey="pharmacies"
          stroke="var(--color-pharmacies)"
          fill="url(#adminFillPharmacies)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--color-pharmacies)' }}
          activeDot={{ r: 5 }}
        />
      )
    ) : null

  const ChartRoot = useLine ? LineChart : AreaChart

  return (
    <div className={cn('space-y-4 px-2 pb-4 pt-2 sm:px-6', className)}>
      <p className="text-sm text-muted-foreground">{description}</p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border p-0.5">
          <Button
            type="button"
            size="sm"
            variant={range === '6' ? 'default' : 'ghost'}
            className="h-8 rounded-md px-3"
            onClick={() => setRange('6')}
          >
            6 months
          </Button>
          <Button
            type="button"
            size="sm"
            variant={range === '12' ? 'default' : 'ghost'}
            className="h-8 rounded-md px-3"
            onClick={() => setRange('12')}
          >
            12 months
          </Button>
        </div>

        <div className="flex rounded-lg border p-0.5">
          <Button
            type="button"
            size="sm"
            variant={metric === 'revenue' ? 'default' : 'ghost'}
            className="h-8 rounded-md px-3"
            onClick={() => setMetric('revenue')}
          >
            Revenue
          </Button>
          <Button
            type="button"
            size="sm"
            variant={metric === 'pharmacies' ? 'default' : 'ghost'}
            className="h-8 rounded-md px-3"
            onClick={() => setMetric('pharmacies')}
          >
            Pharmacies
          </Button>
          <Button
            type="button"
            size="sm"
            variant={metric === 'both' ? 'default' : 'ghost'}
            className="h-8 rounded-md px-3"
            onClick={() => setMetric('both')}
          >
            Both
          </Button>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full">
        {metric === 'pharmacies' ? (
          <BarChart data={visibleData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="axisLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={16}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              width={36}
            />
            <ChartTooltip
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as PlatformChartPoint | undefined
                    return row?.month ?? ''
                  }}
                  formatter={(value) => [value, 'Pharmacies']}
                />
              }
            />
            <Bar dataKey="pharmacies" fill="var(--color-pharmacies)" radius={[4, 4, 0, 0]} />
            {showBrush ? (
              <Brush dataKey="axisLabel" height={28} stroke="hsl(var(--border))" />
            ) : null}
          </BarChart>
        ) : (
          <ChartRoot data={visibleData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            {!useLine ? (
              <defs>
                <linearGradient id="adminFillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="adminFillPharmacies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-pharmacies)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-pharmacies)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
            ) : null}
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="axisLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={16}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="revenue"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={52}
              tickFormatter={(v) =>
                Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : String(v)
              }
            />
            {metric === 'both' ? (
              <YAxis
                yAxisId="pharmacies"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={36}
                allowDecimals={false}
              />
            ) : null}
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as PlatformChartPoint | undefined
                    return row?.month ?? ''
                  }}
                  formatter={(value, name) => {
                    if (name === 'revenue') return [formatRwf(Number(value)), 'Revenue']
                    return [value, 'Pharmacies']
                  }}
                />
              }
            />
            {(metric === 'revenue' || metric === 'both') && revenueSeries}
            {pharmaciesSeries}
            <ChartLegend content={<ChartLegendContent />} />
            {showBrush ? (
              <Brush dataKey="axisLabel" height={28} stroke="hsl(var(--border))" />
            ) : null}
          </ChartRoot>
        )}
      </ChartContainer>
    </div>
  )
}
