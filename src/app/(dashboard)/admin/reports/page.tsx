'use client'

import { type FormEvent, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import {
  BarChart3,
  Building2,
  DollarSign,
  Receipt,
  TrendingUp,
  Upload,
  Users,
} from 'lucide-react'

import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { DashboardPageShell } from '@/components/dashboard'
import {
  adminReportsExportColumns,
} from '@/components/admin/admin-reports-export-columns'
import {
  adminReportsPlanColumns,
  type PlanBreakdownRow,
} from '@/components/admin/admin-reports-plan-columns'
import { PlatformAnalyticsChart } from '@/components/admin/platform-analytics-chart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import {
  adminReportsSummaryQueryKey,
  useAdminReportsSummary,
  usePlatformChartData,
  useUploadPlatformAdminReportMutation,
} from '@/hooks'

import { formatMoney, getPlatformCurrency } from '@/lib/platform-currency'

function formatPlatformMoney(amount: number): string {
  const c = getPlatformCurrency()
  if (amount >= 1_000_000) return `${c} ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `${c} ${Math.round(amount / 1_000)}K`
  return formatMoney(amount, c)
}

export default function ReportsPage() {
  const queryClient = useQueryClient()
  const reportsQuery = useAdminReportsSummary()
  const chart = usePlatformChartData({ months: 12 })
  const uploadMutation = useUploadPlatformAdminReportMutation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [reportName, setReportName] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [reportCategory, setReportCategory] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const totalRevenue = reportsQuery.data?.totalRevenue ?? 0
  const estimatedMrr = reportsQuery.data?.estimatedMrr ?? 0
  const completedPaymentCount = reportsQuery.data?.completedPaymentCount ?? 0
  const pendingPaymentCount = reportsQuery.data?.pendingPaymentCount ?? 0
  const activePharmacies = reportsQuery.data?.activePharmacies ?? 0
  const totalUsers = reportsQuery.data?.totalUsers ?? 0
  const planBreakdown = reportsQuery.data?.planBreakdown ?? []
  const exportableReports = reportsQuery.data?.exportableReports ?? []

  const breakdownDenominator = useMemo(() => {
    const fromPlans = planBreakdown.reduce((s, p) => s + p.revenue, 0)
    if (fromPlans > 0) return fromPlans
    if (totalRevenue > 0) return totalRevenue
    return 1
  }, [planBreakdown, totalRevenue])

  const planTableRows = useMemo((): PlanBreakdownRow[] => {
    return planBreakdown.map((plan) => ({
      plan_name: plan.plan_name,
      subscribers: plan.subscribers,
      revenue: plan.revenue,
      sharePct: Math.round((plan.revenue / breakdownDenominator) * 100),
    }))
  }, [planBreakdown, breakdownDenominator])

  const planColumns = useMemo(() => adminReportsPlanColumns(), [])
  const exportColumns = useMemo(() => adminReportsExportColumns(), [])

  const metrics = useMemo(
    () => [
      {
        title: 'Cash collected',
        value: formatPlatformMoney(totalRevenue),
        caption:
          totalRevenue > 0
            ? `${completedPaymentCount} completed payment(s)`
            : 'No completed payments — check Billing',
        icon: DollarSign,
      },
      {
        title: 'Est. monthly recurring',
        value: formatPlatformMoney(estimatedMrr),
        caption: 'Active subscriptions × catalog price',
        icon: TrendingUp,
      },
      {
        title: 'Active pharmacies',
        value: activePharmacies.toString(),
        caption: 'Status active or trial',
        icon: Building2,
      },
      {
        title: 'Total users',
        value: totalUsers.toString(),
        caption: 'All platform users',
        icon: Users,
      },
    ],
    [
      totalRevenue,
      estimatedMrr,
      completedPaymentCount,
      activePharmacies,
      totalUsers,
    ],
  )

  const handleUploadReport = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploadError(null)
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setUploadError('Choose a file to upload.')
      return
    }
    uploadMutation.mutate(
      {
        file,
        name: reportName.trim() || undefined,
        description: reportDescription.trim() || undefined,
        category: reportCategory.trim() || undefined,
      },
      {
        onSuccess: () => {
          setReportName('')
          setReportDescription('')
          setReportCategory('')
          if (fileRef.current) fileRef.current.value = ''
          void queryClient.invalidateQueries({
            queryKey: adminReportsSummaryQueryKey,
          })
        },
        onError: (err) => {
          setUploadError(err instanceof Error ? err.message : 'Upload failed')
        },
      },
    )
  }

  const pageLoading = reportsQuery.isLoading || chart.loading
  const pageError =
    reportsQuery.isError && reportsQuery.error instanceof Error
      ? reportsQuery.error.message
      : chart.error

  if (pageLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (pageError && !reportsQuery.data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-destructive" role="alert">
          {pageError}
        </p>
      </div>
    )
  }

  return (
    <DashboardPageShell className="max-w-7xl mx-auto">
      <AdminPageHeader
        pinTitle="Business Reports & Analytics"
        title={
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
            <BarChart3 className="h-8 w-8 text-primary" />
            Business Reports &amp; Analytics
          </h1>
        }
        description="Platform revenue, subscriptions, and downloadable exports"
        actions={
          <Button variant="outline" asChild>
            <Link href="/admin/billing">
              <Receipt className="mr-2 h-4 w-4" />
              Billing
            </Link>
          </Button>
        }
      />

      {totalRevenue === 0 && (estimatedMrr > 0 || pendingPaymentCount > 0) ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <p className="font-medium">
            Cash collected is RWF 0, but you have active subscriptions.
          </p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-200/90">
            The chart shows estimated MRR when payment history is empty.
            {pendingPaymentCount > 0
              ? ` ${pendingPaymentCount} payment(s) are pending.`
              : ' Sync completed payments from Billing if needed.'}
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                {metric.caption}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue &amp; growth</CardTitle>
          <CardDescription>
            Same chart as the platform dashboard — monthly cash collected and
            pharmacy activity. Use line view for trends; bar view for sign-ups.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!chart.hasChartActivity ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              No pharmacies or payments to chart yet.
            </div>
          ) : (
            <PlatformAnalyticsChart
              data={chart.chartData}
              hasPaymentHistory={chart.hasPaymentHistory}
              variant="line"
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plan breakdown</CardTitle>
            <CardDescription>
              Estimated recurring revenue by plan (active subscriptions × catalog
              price).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={planColumns}
              data={planTableRows}
              pagination={planTableRows.length > 8}
              pageSize={8}
              emptyMessage="No subscription data available."
              enableSorting
              initialSorting={[{ id: 'revenue', desc: true }]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stored exports</CardTitle>
            <CardDescription>
              Upload a file for admins or download a previous export (links expire
              after one hour).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={handleUploadReport}
              className="space-y-3 rounded-lg border bg-muted/15 p-4"
            >
              <p className="text-sm font-medium">Add export</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="report-file">File</Label>
                  <Input
                    id="report-file"
                    ref={fileRef}
                    type="file"
                    required
                    className="cursor-pointer"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="report-name">Display name (optional)</Label>
                  <Input
                    id="report-name"
                    value={reportName}
                    onChange={(ev) => setReportName(ev.target.value)}
                    placeholder="Defaults to file name"
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="report-desc">Description (optional)</Label>
                  <Input
                    id="report-desc"
                    value={reportDescription}
                    onChange={(ev) => setReportDescription(ev.target.value)}
                    placeholder="Short summary"
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="report-cat">Category (optional)</Label>
                  <Input
                    id="report-cat"
                    value={reportCategory}
                    onChange={(ev) => setReportCategory(ev.target.value)}
                    placeholder="e.g. Financial"
                  />
                </div>
              </div>
              {uploadError ? (
                <p className="text-sm text-destructive" role="alert">
                  {uploadError}
                </p>
              ) : null}
              <Button type="submit" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </form>

            <DataTable
              columns={exportColumns}
              data={exportableReports}
              pagination={exportableReports.length > 5}
              pageSize={5}
              emptyMessage="No downloadable reports yet. Upload a file above."
              enableSorting
            />
          </CardContent>
        </Card>
      </div>
    </DashboardPageShell>
  )
}
