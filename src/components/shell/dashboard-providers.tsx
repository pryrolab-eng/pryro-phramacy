"use client";

import { ActivePharmacyProvider } from "@/components/providers/active-pharmacy-provider";
import { PharmacyBrandingProvider } from "@/components/pharmacy/pharmacy-branding-provider";
import {
  DashboardScrollHeaderProvider,
  useDashboardScrollHeader,
} from "@/components/shell/dashboard-scroll-header-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PharmacyProvider } from "@/hooks/usePharmacyStore";
import { AiPanelProvider, AiFloatingTrigger } from "@/components/ai-panel";
import { dashboardSurfaces } from "@/components/dashboard/dashboard-tokens";
import { cn } from "@/lib/utils";
import { useEffect, useRef, type ReactNode } from "react";
import { GlobalPrefetchProvider } from "@/components/global-prefetch-provider";
import { RealtimeInvalidationBridge } from "@/components/shell/realtime-invalidation-bridge";

type Props = {
  children: ReactNode;
  /** Platform admin routes skip tenant pharmacy context. */
  withPharmacyContext?: boolean;
};

type MainScrollProps = {
  children: ReactNode;
  className?: string;
};

/** Scroll container for dashboard pages — shell bar stays fixed above this. */
export function DashboardMainScroll({ children, className }: MainScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { setScrollRoot } = useDashboardScrollHeader();

  useEffect(() => {
    setScrollRoot(ref.current);
    return () => setScrollRoot(null);
  }, [setScrollRoot]);

  return (
    <div
      ref={ref}
      id="dashboard-main-scroll"
      className={cn(
        dashboardSurfaces.page,
        "min-h-0 flex-1 overflow-x-hidden overflow-y-auto",
        className,
      )}
    >
      <div className="flex min-h-full min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

/** Client providers for dashboard routes (password gate lives on `/app` only). */
export function DashboardProviders({
  children,
  withPharmacyContext = true,
}: Props) {
  return (
    <PharmacyProvider>
      <SidebarProvider>
        <AiPanelProvider>
          <DashboardScrollHeaderProvider>
            {withPharmacyContext ? (
              <ActivePharmacyProvider>
                <PharmacyBrandingProvider>
                  <RealtimeInvalidationBridge />
                  <GlobalPrefetchProvider>{children}</GlobalPrefetchProvider>
                </PharmacyBrandingProvider>
              </ActivePharmacyProvider>
            ) : (
              <GlobalPrefetchProvider>{children}</GlobalPrefetchProvider>
            )}
          </DashboardScrollHeaderProvider>
          <AiFloatingTrigger />
        </AiPanelProvider>
      </SidebarProvider>
    </PharmacyProvider>
  );
}

/**
 * Platform admin shell — no pharmacy, branch, or tenant prefetch.
 * Admin pages use platform APIs only.
 */
export function AdminProviders({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AiPanelProvider>
        <DashboardScrollHeaderProvider>
          {children}
        </DashboardScrollHeaderProvider>
        <AiFloatingTrigger />
      </AiPanelProvider>
    </SidebarProvider>
  );
}
