"use client";

import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { DashboardButton, DashboardMetricGrid, DashboardStatCard } from "@/components/dashboard";
import {
  SettingsPanelTitle,
  SettingsSection,
} from "@/components/settings/settings-primitives";
import { useAdminSettings } from "@/components/admin/settings/admin-settings-provider";

export function AdminSettingsAnalyticsPanel() {
  const { analytics } = useAdminSettings();

  return (
    <div className="space-y-8">
      <SettingsPanelTitle
        title="Analytics"
        description="Platform-wide totals from your database"
      />

      <DashboardMetricGrid className="lg:grid-cols-2">
        <DashboardStatCard
          label="Active pharmacies"
          icon={BarChart3}
          value={analytics.active_pharmacies}
        />
        <DashboardStatCard
          label="Total users"
          icon={BarChart3}
          value={analytics.total_users}
        />
        <DashboardStatCard
          label="Total pharmacies"
          icon={BarChart3}
          value={analytics.total_pharmacies}
        />
        <DashboardStatCard
          label="New users (30d)"
          icon={BarChart3}
          value={analytics.new_users_30d}
        />
      </DashboardMetricGrid>

      <SettingsSection title="Reports">
        <div className="px-5 py-4">
          <p className="mb-4 text-sm text-neutral-500">
            Figures refresh when you open this page or save settings. Use reports
            for exports and revenue breakdowns.
          </p>
          <DashboardButton tone="outline" asChild>
            <Link href="/admin/reports">
              <BarChart3 className="mr-2 h-4 w-4" strokeWidth={1.75} />
              View detailed analytics
            </Link>
          </DashboardButton>
        </div>
      </SettingsSection>
    </div>
  );
}
