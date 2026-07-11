'use client'

import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { Building2, CreditCard, BarChart3, AlertTriangle, Users } from "lucide-react";
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import {
  DashboardPageShell,
  DashboardStatCard,
  DashboardSectionCard,
  DashboardMetricGrid,
  DashboardPanelEmpty,
  DashboardPageLoading,
} from '@/components/dashboard';
import {
  AdminPlanDistributionPanel,
  AdminFinanceOverviewPanel,
  AdminRecentRegistrationsPanel,
  AdminInsuranceProvidersPanel,
  AdminRecentPharmaciesPanel,
} from '@/components/admin/dashboard';
import { dashboardText } from '@/components/dashboard/dashboard-tokens';
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
import { useAiPageContext } from '@/components/ai-panel';
import { createAdminPageContext } from '@/lib/ai/page-context';

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

  const getPageContext = useMemo(
    () => () =>
      createAdminPageContext({
        route: "/admin",
        summary: {
          totalShops: stats.totalShops,
          activePharmacies,
          expiredBusinesses: stats.expiredBusinesses,
          subscriptionRevenue: stats.subscriptionRevenue,
          totalUsers,
          totalCategories: categoriesCount,
          totalPlans: stats.totalPlans,
          // Chart data — last 6 months of revenue and pharmacy growth
          ...Object.fromEntries(
            chartData.slice(-6).map((d) => [
              `chart_${d.axisLabel}_revenue`,
              d.revenue,
            ]),
          ),
          ...Object.fromEntries(
            chartData.slice(-6).map((d) => [
              `chart_${d.axisLabel}_pharmacies`,
              d.pharmacies,
            ]),
          ),
        },
      }),
    [stats, activePharmacies, totalUsers, categoriesCount, chartData],
  )
  useAiPageContext("admin_dashboard", getPageContext)

  if (loading) {
    return <DashboardPageLoading label="Loading platform dashboard…" />
  }

  const hasPaymentHistory = (reports?.revenueData?.length ?? 0) > 0
  const hasChartActivity = chartData.some(
    (d) => d.revenue > 0 || d.pharmacies > 0,
  )
  const hasSubscriptionBreakdown = (reports?.planBreakdown?.length ?? 0) > 0

  return (
    <DashboardPageShell>
      <AdminPageHeader
        pinTitle="Platform Dashboard"
        title={
          <div className="flex flex-wrap items-center gap-2">
            <h1 className={dashboardText.title}>Platform Dashboard</h1>
            <RealtimeStatus />
          </div>
        }
        description="Manage pharmacies, insurance, subscriptions, and analytics"
        actions={<PlatformDashboardActions />}
      />

      <DashboardMetricGrid className="lg:grid-cols-3">
        <DashboardStatCard
          label="Total shops"
          icon={Building2}
          value={stats.totalShops}
          hint={`${activePharmacies} active · +${stats.newThisMonth} this month`}
        />
        <DashboardStatCard
          label="Expired businesses"
          icon={AlertTriangle}
          value={stats.expiredBusinesses}
          hint="Requires attention"
          valueClassName={
            stats.expiredBusinesses > 0 ? 'text-amber-700 dark:text-amber-400' : undefined
          }
        />
        <DashboardStatCard
          label="Est. recurring"
          icon={CreditCard}
          value={`RWF ${(stats.subscriptionRevenue / 1000).toLocaleString()}K`}
          hint="Active subs — plan price"
        />
        <DashboardStatCard
          label="Categories"
          icon={BarChart3}
          value={categoriesCount || stats.totalCategories}
          hint="Global catalog"
        />
        <DashboardStatCard
          label="Platform users"
          icon={Users}
          value={totalUsers}
          hint="Staff across pharmacies"
        />
        <DashboardStatCard
          label="Catalog plans"
          icon={CreditCard}
          value={stats.totalPlans}
          hint="Subscription tiers"
        />
      </DashboardMetricGrid>

      <DashboardSectionCard
        title="Platform analytics"
        description="Revenue and pharmacy growth over time"
        contentClassName="p-0"
      >
        {!hasChartActivity && stats.totalShops === 0 ? (
          <DashboardPanelEmpty
            className="min-h-[240px] border-0 bg-transparent shadow-none"
            icon={BarChart3}
            title="No analytics yet"
            description="Charts appear when pharmacies register or payments are recorded."
            actionLabel="View stores"
            actionHref="/admin/stores"
          />
        ) : (
          <PlatformAnalyticsChart
            data={chartData}
            hasPaymentHistory={hasPaymentHistory}
          />
        )}
      </DashboardSectionCard>

      <div className="grid gap-6 lg:grid-cols-3">
        <AdminPlanDistributionPanel
          plans={planDistribution}
          hasSubscriptionBreakdown={hasSubscriptionBreakdown}
        />
        <AdminFinanceOverviewPanel
          plans={planDistribution}
          subscriptionRevenue={stats.subscriptionRevenue}
          paymentRevenue={paymentRevenue}
        />
        <AdminRecentRegistrationsPanel users={recentUsers} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <AdminInsuranceProvidersPanel
          providers={insuranceProviders}
          preview={previewInsurance}
        />
        <AdminRecentPharmaciesPanel
          totalCount={recentPharmacies.length}
          preview={previewPharmacies.map((pharmacy) => ({
            id: pharmacy.id,
            name: pharmacy.name,
            address: pharmacy.address,
            city: pharmacy.city,
            status: pharmacy.status,
            planLabel: resolvePharmacyPlanLabel(pharmacy, catalogPlans),
          }))}
        />
      </div>
    </DashboardPageShell>
  )
}
