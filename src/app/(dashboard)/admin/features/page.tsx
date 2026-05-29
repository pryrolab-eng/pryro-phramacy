"use client";

import { FeatureCatalogPanel } from "@/components/admin/feature-catalog-panel";
import { DashboardPageShell } from "@/components/dashboard";

export default function AdminFeaturesPage() {
  return (
    <DashboardPageShell>
      <FeatureCatalogPanel />
    </DashboardPageShell>
  );
}
