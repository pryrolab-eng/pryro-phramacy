"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DashboardButton,
  DashboardPanelEmpty,
  DashboardSectionCard,
} from "@/components/dashboard";
import {
  AdminDividedList,
  AdminFlatRow,
  AdminRowIcon,
  AdminStatusChip,
} from "@/components/admin/dashboard/admin-dashboard-ui";

type InsuranceRow = {
  id: string | number;
  name?: string | null;
  coverage_percentage?: number | null;
  is_active?: boolean | null;
};

type Props = {
  providers: InsuranceRow[];
  preview: InsuranceRow[];
};

export function AdminInsuranceProvidersPanel({ providers, preview }: Props) {
  return (
    <DashboardSectionCard
      title="Insurance providers"
      description={
        providers.length > 0
          ? `Global coverage partners · ${providers.length} total`
          : "Global coverage partners"
      }
      action={
        providers.length > 0 ? (
          <DashboardButton tone="ghost" asChild>
            <Link href="/admin/insurance-templates">Manage</Link>
          </DashboardButton>
        ) : undefined
      }
      contentClassName="pt-0"
    >
      {preview.length > 0 ? (
        <ScrollArea className="max-h-[300px]">
          <AdminDividedList className="pr-3">
            {preview.map((provider) => {
              const active = provider.is_active !== false;
              const coverage = Number(provider.coverage_percentage ?? 0);
              return (
                <AdminFlatRow key={String(provider.id)}>
                  <AdminRowIcon icon={Shield} />
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
                    {String(provider.name ?? "Provider")}
                  </p>
                  <span className="shrink-0 text-xs font-medium tabular-nums text-neutral-500">
                    {coverage}%
                  </span>
                  <AdminStatusChip tone={active ? "active" : "inactive"}>
                    {active ? "Active" : "Off"}
                  </AdminStatusChip>
                </AdminFlatRow>
              );
            })}
          </AdminDividedList>
        </ScrollArea>
      ) : (
        <DashboardPanelEmpty
          className="min-h-[200px] border-0 bg-transparent shadow-none"
          icon={Shield}
          title="No providers yet"
          description="Add insurance partners for pharmacies to use at POS."
          actionLabel="Manage templates"
          actionHref="/admin/insurance-templates"
        />
      )}
    </DashboardSectionCard>
  );
}
