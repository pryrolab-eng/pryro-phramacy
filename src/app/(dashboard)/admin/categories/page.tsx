"use client";

import { AdminCategoriesPanel } from "@/components/admin/admin-categories-panel";
import { DashboardPageShell } from "@/components/dashboard";

export default function CategoriesPage() {
  return (
    <DashboardPageShell>
      <AdminCategoriesPanel />
    </DashboardPageShell>
  );
}
