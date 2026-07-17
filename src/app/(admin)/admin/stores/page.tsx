"use client";

import { AdminStoresPanel } from "@/components/admin/admin-stores-panel";
import { DashboardPageShell } from "@/components/dashboard";

export default function PharmacyManagementPage() {
  return (
    <DashboardPageShell>
      <AdminStoresPanel />
    </DashboardPageShell>
  );
}
