"use client";

import { PharmacyProvider } from "@/hooks/usePharmacyStore";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AiPanelProvider, AiFloatingTrigger } from "@/components/ai-panel";
import { DashboardScrollHeaderProvider } from "@/components/shell/dashboard-scroll-header-context";
import { GlobalPrefetchProvider } from "@/components/global-prefetch-provider";
import type { ReactNode } from "react";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PharmacyProvider>
      <SidebarProvider>
        <AiPanelProvider>
          <DashboardScrollHeaderProvider>
            <GlobalPrefetchProvider>{children}</GlobalPrefetchProvider>
          </DashboardScrollHeaderProvider>
          <AiFloatingTrigger />
        </AiPanelProvider>
      </SidebarProvider>
    </PharmacyProvider>
  );
}