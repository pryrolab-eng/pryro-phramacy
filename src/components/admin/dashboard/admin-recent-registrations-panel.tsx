"use client";

import { Building2 } from "lucide-react";
import {
  DashboardPanelEmpty,
  DashboardSectionCard,
} from "@/components/dashboard";
import {
  AdminDividedList,
  AdminFlatRow,
  AdminRowIcon,
  AdminStatusChip,
} from "@/components/admin/dashboard/admin-dashboard-ui";

export type RecentRegistrationRow = {
  email: string;
  shop: string;
  date: string;
  plan: string;
};

type Props = {
  users: RecentRegistrationRow[];
};

export function AdminRecentRegistrationsPanel({ users }: Props) {
  return (
    <DashboardSectionCard
      title="New registrations"
      description="Recent pharmacy sign-ups"
      contentClassName="pt-2"
    >
      {users.length > 0 ? (
        <AdminDividedList>
          {users.map((user, index) => (
            <AdminFlatRow key={`${user.email}-${index}`}>
              <AdminRowIcon icon={Building2} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-50">
                  {user.email}
                </p>
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  {user.shop} · {user.date}
                </p>
              </div>
              <AdminStatusChip tone="plan">{user.plan}</AdminStatusChip>
            </AdminFlatRow>
          ))}
        </AdminDividedList>
      ) : (
        <DashboardPanelEmpty
          className="min-h-[200px] border-0 bg-transparent shadow-none"
          icon={Building2}
          title="No recent registrations"
          description="New pharmacy sign-ups will show up here."
        />
      )}
    </DashboardSectionCard>
  );
}
