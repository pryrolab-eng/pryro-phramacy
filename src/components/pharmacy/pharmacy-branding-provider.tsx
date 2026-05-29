"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import {
  DEFAULT_PHARMACY_BRANDING,
  usePharmacyBranding,
} from "@/hooks/usePharmacyBranding";
import { usePharmacyEntitlements } from "@/hooks/usePharmacyEntitlements";
import type { PharmacyBranding } from "@/lib/http/pharmacy-branding";
import {
  applyPharmacyBrandingTheme,
  clearPharmacyBrandingTheme,
} from "@/lib/pharmacy/apply-branding-theme";

type PharmacyBrandingContextValue = {
  pharmacyId: string | null;
  pharmacyName: string;
  branding: PharmacyBranding;
  isLoading: boolean;
};

const PharmacyBrandingCtx = createContext<PharmacyBrandingContextValue | null>(
  null,
);

export function PharmacyBrandingProvider({ children }: { children: ReactNode }) {
  const { activePharmacyId, context, isPending: ctxPending } = useActivePharmacy();
  const { can, isHydrating, isEntitlementsReady } = usePharmacyEntitlements();
  const hasCustomization = isEntitlementsReady && can("customization");
  const brandingQuery = usePharmacyBranding(activePharmacyId, {
    enabled: hasCustomization,
  });

  const pharmacyName = useMemo(() => {
    if (!activePharmacyId) return "Pharmacy";
    const membership = context.memberships.find(
      (m) => m.pharmacyId === activePharmacyId,
    );
    return membership?.pharmacyName?.trim() || "Pharmacy";
  }, [activePharmacyId, context.memberships]);

  const branding = useMemo(() => {
    if (!hasCustomization) return DEFAULT_PHARMACY_BRANDING;
    return brandingQuery.data ?? DEFAULT_PHARMACY_BRANDING;
  }, [hasCustomization, brandingQuery.data]);

  useEffect(() => {
    if (!activePharmacyId || !hasCustomization) {
      clearPharmacyBrandingTheme();
      return;
    }
    applyPharmacyBrandingTheme(branding.primaryColor);
    return () => clearPharmacyBrandingTheme();
  }, [activePharmacyId, hasCustomization, branding.primaryColor]);

  const value = useMemo(
    () => ({
      pharmacyId: activePharmacyId,
      pharmacyName,
      branding,
      isLoading: ctxPending || isHydrating || brandingQuery.isPending,
    }),
    [
      activePharmacyId,
      pharmacyName,
      branding,
      ctxPending,
      isHydrating,
      brandingQuery.isPending,
    ],
  );

  return (
    <PharmacyBrandingCtx.Provider value={value}>
      {children}
    </PharmacyBrandingCtx.Provider>
  );
}

export function usePharmacyBrandingContext() {
  const ctx = useContext(PharmacyBrandingCtx);
  if (!ctx) {
    throw new Error(
      "usePharmacyBrandingContext must be used within PharmacyBrandingProvider",
    );
  }
  return ctx;
}

/** Safe for sidebars — returns defaults when provider is absent (e.g. superadmin). */
export function usePharmacyBrandingOptional() {
  const ctx = useContext(PharmacyBrandingCtx);
  return (
    ctx ?? {
      pharmacyId: null,
      pharmacyName: "Pryrox",
      branding: DEFAULT_PHARMACY_BRANDING,
      isLoading: false,
    }
  );
}
