'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, CreditCard, BarChart3, AlertTriangle, MapPin, Shield, Users, Receipt } from "lucide-react";
import { Button } from '@/components/ui/button'
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Spinner } from '@/components/ui/spinner';
import {
  adminPharmaciesQueryKey,
  adminReportsSummaryQueryKey,
  useAdminDashboardData,
  useInsuranceProviders,
} from '@/hooks';
import { PlatformAnalyticsChart } from '@/components/admin/platform-analytics-chart';
import { PlatformDashboardActions } from '@/components/admin/platform-dashboard-actions';
import { RealtimeStatus } from '@/components/RealtimeStatus';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { buildPlatformChartSeries } from '@/lib/admin/chart-series';
import {
  planDisplayName,
  normalizePlanKey,
  planKeysFromCatalog,
  resolvePharmacyPlanLabel,
  type CatalogPlanLike,
} from '@/lib/admin/plan-stats';

interface AdminStats {
  totalShops: number
  newThisMonth: number
  expiredBusinesses: number
  totalPlans: number
  totalCategories: number
  subscriptionRevenue: number
}

export default function AdminPage() {
  const queryClient = useQueryClient()
  const { pharmaciesQ, plansQ, categoriesQ, reportsQ, loading } =
    useAdminDashboardData()
  const insuranceQuery = useInsuranceProviders()

  useRealtimeUpdates(() => {
    void queryClient.invalidateQueries({ queryKey: adminPharmaciesQueryKey })
    void queryClient.invalidateQueries({ queryKey: adminReportsSummaryQueryKey })
  })

  const categoriesCount = (categoriesQ.data ?? []).length
  const reports = reportsQ.data
  const insuranceProviders = insuranceQuery.data ?? []

  const catalogPlans = (plansQ.data?.plans ?? []) as CatalogPlanLike[]

  const {
    stats,
    planDistribution,
    recentUsers,
    chartData,
    paymentRevenue,
  } = useMemo(() => {
    const pharmacies = (pharmaciesQ.data ?? []) as Array<{
      subscription_plan?: string
      catalog_plan_name?: string | null
      created_at?: string
      subscription_expires_at?: string | null
      email?: string
      name?: string
    }>
    const plans = catalogPlans as Array<{
      name: string
      price?: number | string
      active_subscriber_count?: number
    }>

    const planBreakdown = reports?.planBreakdown ?? []
    const paymentRevenue = reports?.totalRevenue ?? 0

    const countsFromPharmacies: Record<string, number> = {}
    pharmacies.forEach((p) => {
      const key = normalizePlanKey(p.subscription_plan)
      countsFromPharmacies[key] = (countsFromPharmacies[key] ?? 0) + 1
    })

    const countsFromSubscriptions: Record<string, number> = {}
    planBreakdown.forEach((row) => {
      const key = normalizePlanKey(row.plan_name)
      countsFromSubscriptions[key] = row.subscribers
    })

    const priceByKey: Record<string, number> = {}
    plans.forEach((plan) => {
      priceByKey[normalizePlanKey(plan.name)] = Number(plan.price ?? 0)
    })
    planBreakdown.forEach((row) => {
      const key = normalizePlanKey(row.plan_name)
      if (row.subscribers > 0) {
        priceByKey[key] = row.revenue / row.subscribers
      }
    })

    const useSubscriptionCounts = planBreakdown.length > 0
    const countSource = useSubscriptionCounts
      ? countsFromSubscriptions
      : countsFromPharmacies

    const totalForPct = useSubscriptionCounts
      ? planBreakdown.reduce((s, r) => s + r.subscribers, 0)
      : pharmacies.length

    const planOrder = planKeysFromCatalog(plans)
    const distribution = planOrder.map((key) => {
      const count = countSource[key] ?? 0
      const revenue = useSubscriptionCounts
        ? (planBreakdown.find((r) => normalizePlanKey(r.plan_name) === key)
            ?.revenue ?? 0)
        : count * (priceByKey[key] ?? 0)
      return {
        key,
        name: planDisplayName(key, plans),
        count,
        revenue,
        percentage:
          totalForPct > 0 ? Math.round((count / totalForPct) * 100) : 0,
      }
    })

    const estimatedMrr = distribution.reduce((s, p) => s + p.revenue, 0)

    const statsValue: AdminStats = {
      totalShops: pharmacies.length,
      newThisMonth: pharmacies.filter((p) => {
        if (!p.created_at) return false
        const created = new Date(p.created_at)
        const thisMonth = new Date()
        return (
          created.getMonth() === thisMonth.getMonth() &&
          created.getFullYear() === thisMonth.getFullYear()
        )
      }).length,
      expiredBusinesses: pharmacies.filter(
        (p) =>
          p.subscription_expires_at &&
          new Date(p.subscription_expires_at) < new Date(),
      ).length,
      totalPlans: plans.length,
      totalCategories: categoriesCount,
      subscriptionRevenue: estimatedMrr,
    }

    const recent = [...pharmacies]
      .sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0
        return tb - ta
      })
      .slice(0, 4)
      .map((p) => ({
        email: p.email ?? '',
        shop: p.name ?? '',
        date: p.created_at ? new Date(p.created_at).toLocaleDateString() : '',
        plan: resolvePharmacyPlanLabel(p, plans),
      }))

    const revenueData = reports?.revenueData ?? []
    const chartDataArray = buildPlatformChartSeries(pharmacies, revenueData, {
      months: 12,
    })

    return {
      stats: statsValue,
      planDistribution: distribution,
      recentUsers: recent,
      chartData: chartDataArray,
      paymentRevenue,
    }
  }, [pharmaciesQ.data, catalogPlans, categoriesCount, reports])

  const recentPharmacies = useMemo(() => {
    const rows = (pharmaciesQ.data ?? []) as Array<{
      id?: string
      name?: string
      address?: string
      city?: string
      status?: string
      subscription_plan?: string
      created_at?: string
    }>
    const sorted = [...rows].sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0
      return tb - ta
    })
    const seen = new Set<string>()
    const unique: typeof rows = []
    for (const p of sorted) {
      const key = String(p.id ?? p.name ?? '')
      if (!key || seen.has(key)) continue
      seen.add(key)
      unique.push(p)
    }
    return unique
  }, [pharmaciesQ.data])

  const previewInsurance = insuranceProviders.slice(0, 6)
  const previewPharmacies = recentPharmacies.slice(0, 6)

  const activePharmacies = reports?.activePharmacies ?? stats.totalShops
  const totalUsers = reports?.totalUsers ?? 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="size-6" />
      </div>
    )
  }

  const hasPaymentHistory = (reports?.revenueData?.length ?? 0) > 0
  const hasChartActivity = chartData.some(
    (d) => d.revenue > 0 || d.pharmacies > 0,
  )
  const hasSubscriptionBreakdown = (reports?.planBreakdown?.length ?? 0) > 0

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <AdminPageHeader
          title={
            <>
              <h1 className="text-3xl font-bold">Platform Dashboard</h1>
              <RealtimeStatus />
            </>
          }
          description="Manage pharmacies, insurance, subscriptions, and analytics"
          actions={<PlatformDashboardActions />}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shops</CardTitle>
              <Building2 className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalShops}</div>
              <p className="text-xs text-muted-foreground">
                {activePharmacies} active · +{stats.newThisMonth} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Businesses</CardTitle>
              <AlertTriangle className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expiredBusinesses}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Recurring</CardTitle>
              <CreditCard className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                RWF {(stats.subscriptionRevenue / 1000).toLocaleString()}K
              </div>
              <p className="text-xs text-muted-foreground">Active subs — plan price</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <BarChart3 className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoriesCount || stats.totalCategories}</div>
              <p className="text-xs text-muted-foreground">Global catalog</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Users</CardTitle>
              <Users className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">Staff across pharmacies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Catalog Plans</CardTitle>
              <CreditCard className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlans}</div>
              <p className="text-xs text-muted-foreground">Subscription tiers</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Platform Analytics</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!hasChartActivity && stats.totalShops === 0 ? (
              <div className="px-6 py-4 text-center text-sm text-muted-foreground">
                No pharmacies or payments to chart yet.
              </div>
            ) : (
              <PlatformAnalyticsChart
                data={chartData}
                hasPaymentHistory={hasPaymentHistory}
              />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan Overview</CardTitle>
              <CardDescription>
                {hasSubscriptionBreakdown
                  ? 'Active subscriptions from the subscriptions table'
                  : 'Pharmacies grouped by subscription_plan on each store'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {planDistribution.map((plan, index) => (
                  <div key={plan.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          index === 0 ? 'bg-gray-800' :
                          index === 1 ? 'bg-gray-600' : 'bg-gray-400'
                        }`}
                      />
                      <span className="font-medium">{plan.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {plan.count}{' '}
                        {hasSubscriptionBreakdown ? 'subscriptions' : 'shops'}
                      </p>
                      <p className="text-xs text-muted-foreground">{plan.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Finance Overview</CardTitle>
              <CardDescription>
                Estimated recurring revenue by plan (same source as Reports).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {planDistribution.map((plan) => (
                  <div key={plan.name} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{plan.name} Plans</span>
                    <span className="font-semibold">RWF {plan.revenue.toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Est. recurring total</span>
                    <span className="font-bold text-lg">
                      RWF {stats.subscriptionRevenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Completed payments (all time)</span>
                    <span>RWF {paymentRevenue.toLocaleString()}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                    <Link href="/admin/billing">
                      <Receipt className="h-4 w-4 mr-2" />
                      View transactions &amp; sync invoices
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>New Registered Users</CardTitle>
              <CardDescription>Recent pharmacy registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentUsers.length > 0 ? (
                  recentUsers.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.shop} · {user.date}
                        </p>
                      </div>
                      <Badge variant="outline">{user.plan}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent registrations
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Insurance Providers</CardTitle>
                  <CardDescription className="text-xs">
                    Global coverage partners
                    {insuranceProviders.length > 0
                      ? ` · ${insuranceProviders.length} total`
                      : ''}
                  </CardDescription>
                </div>
                {insuranceProviders.length > 0 ? (
                  <Button variant="ghost" size="sm" className="h-8 shrink-0 text-xs" asChild>
                    <Link href="/admin/insurance-templates">Manage</Link>
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-0">
              {previewInsurance.length > 0 ? (
                <ScrollArea className="h-[220px]">
                  <div className="space-y-1.5 pr-3">
                    {previewInsurance.map((provider) => {
                      const active = provider.is_active !== false
                      const coverage = Number(provider.coverage_percentage ?? 0)
                      return (
                        <div
                          key={String(provider.id)}
                          className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-2"
                        >
                          <Shield className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                          <p className="min-w-0 flex-1 truncate text-sm font-medium">
                            {String(provider.name ?? 'Provider')}
                          </p>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {coverage}%
                          </span>
                          <Badge
                            variant={active ? 'default' : 'secondary'}
                            className="h-5 shrink-0 px-1.5 text-[10px]"
                          >
                            {active ? 'Active' : 'Off'}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No insurance providers yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Recent Pharmacies</CardTitle>
                  <CardDescription className="text-xs">
                    Latest registrations
                    {recentPharmacies.length > 0
                      ? ` · ${recentPharmacies.length} total`
                      : ''}
                  </CardDescription>
                </div>
                {recentPharmacies.length > 0 ? (
                  <Button variant="ghost" size="sm" className="h-8 shrink-0 text-xs" asChild>
                    <Link href="/admin/stores">View all</Link>
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col pt-0">
              {previewPharmacies.length > 0 ? (
                <ScrollArea className="h-[220px]">
                  <div className="space-y-1.5 pr-3">
                    {previewPharmacies.map((pharmacy) => {
                      const location =
                        pharmacy.address || pharmacy.city || '\u2014'
                      const plan = resolvePharmacyPlanLabel(pharmacy, catalogPlans)
                      return (
                        <div
                          key={String(pharmacy.id ?? pharmacy.name)}
                          className="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-2"
                        >
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium leading-tight">
                              {pharmacy.name ?? 'Pharmacy'}
                              <span className="font-normal text-muted-foreground">
                                {' '}
                                · {plan}
                              </span>
                            </p>
                            <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {location}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="h-5 shrink-0 px-1.5 text-[10px] capitalize"
                          >
                            {pharmacy.status ?? 'active'}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No pharmacies yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

