"use client";

import Link from "next/link";
import { Building2, MapPin } from "lucide-react";
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

type PharmacyRow = {
  id?: string;
  name?: string;
  address?: string;
  city?: string;
  status?: string;
  planLabel: string;
};

type Props = {
  totalCount: number;
  preview: PharmacyRow[];
};

function isActiveStatus(status?: string): boolean {
  const s = (status ?? "active").toLowerCase();
  return s === "active" || s === "approved";
}

export function AdminRecentPharmaciesPanel({ totalCount, preview }: Props) {
  return (
    <DashboardSectionCard
      title="Recent pharmacies"
      description={
        totalCount > 0
          ? `Latest registrations · ${totalCount} total`
          : "Latest registrations"
      }
      action={
        totalCount > 0 ? (
          <DashboardButton tone="ghost" asChild>
            <Link href="/admin/stores">View all</Link>
          </DashboardButton>
        ) : undefined
      }
      contentClassName="pt-0"
    >
      {preview.length > 0 ? (
        <ScrollArea className="max-h-[300px]">
          <AdminDividedList className="pr-3">
            {preview.map((pharmacy) => {
              const location =
                pharmacy.address || pharmacy.city || "\u2014";
              const active = isActiveStatus(pharmacy.status);
              return (
                <AdminFlatRow
                  key={String(pharmacy.id ?? pharmacy.name)}
                  className="items-start"
                >
                  <AdminRowIcon icon={Building2} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
                      {pharmacy.name ?? "Pharmacy"}
                      <span className="font-normal text-neutral-500">
                        {" "}
                        · {pharmacy.planLabel}
                      </span>
                    </p>
                    <p className="mt-1 flex items-start gap-1 text-xs leading-snug text-neutral-500">
                      <MapPin
                        className="mt-0.5 h-3 w-3 shrink-0"
                        strokeWidth={1.75}
                      />
                      <span className="line-clamp-2">{location}</span>
                    </p>
                  </div>
                  <AdminStatusChip tone={active ? "active" : "inactive"}>
                    {pharmacy.status ?? "active"}
                  </AdminStatusChip>
                </AdminFlatRow>
              );
            })}
          </AdminDividedList>
        </ScrollArea>
      ) : (
        <DashboardPanelEmpty
          className="min-h-[200px] border-0 bg-transparent shadow-none"
          icon={Building2}
          title="No pharmacies yet"
          description="Registered stores will appear here as they onboard."
          actionLabel="View stores"
          actionHref="/admin/stores"
        />
      )}
    </DashboardSectionCard>
  );
}
