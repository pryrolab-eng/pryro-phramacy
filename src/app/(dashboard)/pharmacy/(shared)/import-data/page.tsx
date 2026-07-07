"use client";

import { Suspense } from "react";
import { DashboardPageLoading, DashboardPageShell } from "@/components/dashboard";
import { PharmacyImportDataPanel } from "@/components/pharmacy/pharmacy-import-data-panel";
import { FeatureGate } from "@/components/subscription/feature-gate";

export default function PharmacyImportDataPage() {
  return (
    <Suspense fallback={<DashboardPageLoading label="Loading import tools…" />}>
      <FeatureGate featureKey="inventory.access">
        <DashboardPageShell>
          <PharmacyImportDataPanel />
        </DashboardPageShell>
      </FeatureGate>
    </Suspense>
  );
}
