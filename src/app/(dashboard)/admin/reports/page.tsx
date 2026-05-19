'use client'

import { type FormEvent, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Download, FileStack, TrendingUp, Users, Building2, DollarSign, Upload, Receipt } from "lucide-react";
import { Spinner } from '@/components/ui/spinner';
import { useAdminReportsSummary, useUploadPlatformAdminReportMutation } from '@/hooks';

function formatRwf(amount: number): string {
  if (amount >= 1_000_000) return `RWF ${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `RWF ${Math.round(amount / 1_000)}K`
  return `RWF ${amount.toLocaleString()}`
}

export default function ReportsPage() {
  const reportsQuery = useAdminReportsSummary()
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
  const revenueData = reportsQuery.data?.revenueData ?? []
  const planBreakdown = reportsQuery.data?.planBreakdown ?? []
  const exportableReports = reportsQuery.data?.exportableReports ?? []

  const metrics = useMemo(
    () => [
      {
        title: "Cash collected",
        value: formatRwf(totalRevenue),
        caption:
          totalRevenue > 0
            ? `${completedPaymentCount} completed payment(s) — KPay & Polar`
            : "No completed payments yet — use Billing to sync or check transactions",
        icon: DollarSign,
      },
      {
        title: "Est. monthly recurring",
        value: formatRwf(estimatedMrr),
        caption: "Active subscriptions × plan catalog price (not cash)",
        icon: TrendingUp,
      },
      {
        title: "Active Pharmacies",
        value: activePharmacies.toString(),
        caption: "Pharmacies with status active or trial",
        icon: Building2,
      },
      {
        title: "Total Users",
        value: totalUsers.toString(),
        caption: "Total users in the database",
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
  );

  const planRevenueTotal = useMemo(
    () => planBreakdown.reduce((sum, p) => sum + p.revenue, 0),
    [planBreakdown],
  )
  const subscriberTotal = useMemo(
    () => planBreakdown.reduce((sum, p) => sum + p.subscribers, 0),
    [planBreakdown],
  )

  /** Payment-backed months when available; otherwise one bar from active subscription MRR. */
  const revenueChartSeries = useMemo(() => {
    if (revenueData.length > 0) {
      return revenueData.map((d) => ({ ...d, source: "payments" as const }))
    }
    if (planRevenueTotal > 0) {
      return [
        {
          month: "Current",
          revenue: planRevenueTotal,
          pharmacies: subscriberTotal,
          source: "subscriptions" as const,
        },
      ]
    }
    return []
  }, [revenueData, planRevenueTotal, subscriberTotal])

  const breakdownDenominator = useMemo(() => {
    const fromPlans = planBreakdown.reduce((s, p) => s + p.revenue, 0)
    if (fromPlans > 0) return fromPlans
    if (totalRevenue > 0) return totalRevenue
    return 1
  }, [planBreakdown, totalRevenue])

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
        },
        onError: (err) => {
          setUploadError(err instanceof Error ? err.message : 'Upload failed')
        },
      },
    )
  }

  if (reportsQuery.isPending) return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner className="size-6" />
    </div>
  )

  if (reportsQuery.isError) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <p className="text-destructive" role="alert">
          {reportsQuery.error instanceof Error
            ? reportsQuery.error.message
            : 'Could not load reports.'}
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">


        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              Business Reports & Analytics
            </h1>
            <p className="text-gray-600">View business analytics and performance metrics</p>
          </div>

          {totalRevenue === 0 && (estimatedMrr > 0 || pendingPaymentCount > 0) ? (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-medium">Cash collected is RWF 0, but you have active subscriptions.</p>
              <p className="mt-1 text-amber-900/90">
                The chart below shows <strong>estimated</strong> monthly recurring (MRR), not money received.
                {pendingPaymentCount > 0
                  ? ` ${pendingPaymentCount} payment(s) are still pending or processing.`
                  : ' If customers paid via Polar/KPay, open Billing and click “Sync invoices from payments”.'}
              </p>
              <Button variant="outline" size="sm" className="mt-3 bg-white" asChild>
                <Link href="/admin/billing">
                  <Receipt className="h-4 w-4 mr-2" />
                  Open Billing &amp; transactions
                </Link>
              </Button>
            </div>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {metrics.map((metric) => (
              <Card key={metric.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <metric.icon className="h-4 w-4" />
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

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>
                Monthly <strong>cash collected</strong> from completed payments (empty until Billing has completed transactions)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-48 space-y-6">
                {revenueData.length === 0 ? (
                  <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">
                      No revenue history to chart yet
                    </p>

                  </div>
                ) : (
                  revenueData.map((data, index) => {
                    const maxRevenue = Math.max(
                      ...revenueData.map((d) => d.revenue),
                      1,
                    );
                    const width = (data.revenue / maxRevenue) * 100;
                    return (
                      <div
                        key={`${data.month}-${index}`}
                        className="flex items-center space-x-4"
                      >
                        <div className="w-28 shrink-0 text-sm font-medium">
                          {data.month}
                        </div>
                        <div className="flex flex-1 items-center space-x-4">
                          <div className="flex-1">
                            <div className="flex h-1 w-full items-center rounded bg-gray-200">
                              <div
                                className="h-1 rounded bg-gray-800 transition-all duration-500"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-16 text-xs font-medium">
                            {formatRwf(data.revenue)}
                          </div>
                          <div className="w-20 text-right">
                            <div className="text-sm font-semibold">
                              {data.pharmacies}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              pharmacies
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Chart</CardTitle>
                <CardDescription>
                  {revenueData.length > 0
                    ? "Completed payments aggregated by calendar month."
                    : planRevenueTotal > 0
                      ? "No payment history yet — bar shows estimated recurring revenue from active subscription plans."
                      : "Add completed payments or active subscriptions to see revenue here."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {revenueChartSeries.length === 0 ? (
                  <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Nothing to chart yet</p>
                    <p className="mt-2">
                      This chart uses payment rows by month, or your current subscription mix when
                      payments are empty.
                    </p>
                  </div>
                ) : (
                <div className="space-y-4">
                  {revenueChartSeries.map((data, index) => {
                    const maxRev = Math.max(
                      ...revenueChartSeries.map((d) => d.revenue),
                      1,
                    )
                    const barPct = (data.revenue / maxRev) * 100
                    return (
                    <div key={`${data.month}-chart-${index}`} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-20 shrink-0 text-sm font-medium">{data.month}</div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded h-2">
                            <div 
                              className="bg-gray-800 h-2 rounded transition-all duration-300"
                              style={{ width: `${barPct}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatRwf(data.revenue)}</div>
                        <div className="text-xs text-muted-foreground">
                          {data.source === "payments"
                            ? `${data.pharmacies} pharmacies`
                            : `${data.pharmacies} active subscriptions`}
                        </div>
                      </div>
                    </div>
                  )
                  })}
                </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>
                  Estimated recurring revenue by plan (active subscriptions × plan price).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planBreakdown.length > 0 ? planBreakdown.map((plan) => {
                    const percentage = ((plan.revenue / breakdownDenominator) * 100).toFixed(0)
                    return (
                      <div key={plan.plan_name} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{plan.plan_name}</p>
                          <p className="text-sm text-muted-foreground">{plan.subscribers} subscribers</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">RWF {plan.revenue.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{percentage}% of total</p>
                        </div>
                      </div>
                    )
                  }) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No subscription data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
              <CardDescription>
                Upload a file to store it for admins, or download a previously stored export.
                Signed links expire after one hour.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <p className="text-xs text-muted-foreground">
                  Max 25 MB. Apply latest Supabase migrations so the{" "}
                  <code className="rounded bg-muted px-1">platform_admin_reports</code> table and{" "}
                  <code className="rounded bg-muted px-1">platform-reports</code> bucket exist.
                </p>
              </form>

              {exportableReports.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {exportableReports.map((report) => (
                    <div key={report.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <h3 className="font-medium">{report.name}</h3>
                        {report.category ? (
                          <Badge variant="outline">{report.category}</Badge>
                        ) : null}
                      </div>
                      {report.description ? (
                        <p className="mb-3 text-sm text-muted-foreground">{report.description}</p>
                      ) : null}
                      <div className="flex items-center justify-between gap-2">
                        {report.lastGenerated ? (
                          <p className="text-xs text-muted-foreground">
                            Last generated: {report.lastGenerated}
                          </p>
                        ) : (
                          <span />
                        )}
                        {report.downloadUrl ? (
                          <Button size="sm" asChild>
                            <a href={report.downloadUrl} rel="noopener noreferrer">
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" disabled title="No file URL yet">
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="flex min-h-[12rem] items-center justify-center rounded-lg border border-dashed bg-muted/20 text-muted-foreground"
                  role="status"
                  aria-label="No downloadable reports yet"
                >
                  <FileStack className="h-14 w-14 stroke-[1.1]" aria-hidden />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

    </div>
  );
}
