"use client";

import { AdminInsuranceTemplatesPanel } from "@/components/admin/admin-insurance-templates-panel";
import { DashboardPageShell } from "@/components/dashboard";

export default function InsuranceTemplatesPage() {
  return (
    <DashboardPageShell>
      <AdminInsuranceTemplatesPanel />
    </DashboardPageShell>
  );
}
