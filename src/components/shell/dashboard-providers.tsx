"use client";

import { ActivePharmacyProvider } from "@/components/providers/active-pharmacy-provider";
import { PharmacyBrandingProvider } from "@/components/pharmacy/pharmacy-branding-provider";
import { DashboardScrollHeaderProvider } from "@/components/shell/dashboard-scroll-header-context";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PharmacyProvider } from "@/hooks/usePharmacyStore";

type Props = {
  children: React.ReactNode;
  /** Platform admin routes skip tenant pharmacy context. */
  withPharmacyContext?: boolean;
};

/** Client providers for dashboard routes (React Query lives in root AppProviders). */
export function DashboardProviders({
  children,
  withPharmacyContext = true,
}: Props) {
  const body = withPharmacyContext ? (
    <ActivePharmacyProvider>
      <PharmacyBrandingProvider>{children}</PharmacyBrandingProvider>
    </ActivePharmacyProvider>
  ) : (
    children
  );

  return (
    <PharmacyProvider>
      <SidebarProvider>
        <DashboardScrollHeaderProvider>{body}</DashboardScrollHeaderProvider>
      </SidebarProvider>
    </PharmacyProvider>
  );
}
