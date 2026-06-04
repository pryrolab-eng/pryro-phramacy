"use client";

import { Suspense } from "react";
import { DashboardPageShell, DashboardPageLoading } from "@/components/dashboard";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { PharmacyInsuranceMedicinesPanel } from "@/components/pharmacy/pharmacy-insurance-medicines-panel";

export default function PharmacyInsuranceMedicinesPage() {
  return (
    <Suspense
      fallback={<DashboardPageLoading label="Loading insurer coverage…" />}
    >
      <FeatureGate
        featureKey="pos.insurance"
        loadingFallback={
          <DashboardPageLoading label="Loading insurer coverage…" />
        }
      >
        <DashboardPageShell>
          <PharmacyInsuranceMedicinesPanel />
        </DashboardPageShell>
      </FeatureGate>
    </Suspense>
  );
}
