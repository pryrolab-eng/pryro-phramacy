"use client";

import { DashboardPageShell } from "@/components/dashboard";
import { PharmacySystemGuidePanel } from "@/components/pharmacy/pharmacy-system-guide-panel";

export default function PharmacyGettingStartedPage() {
  return (
    <DashboardPageShell>
      <PharmacySystemGuidePanel />
    </DashboardPageShell>
  );
}
