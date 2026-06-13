"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useActivePharmacyContext } from "@/hooks/useActivePharmacyContext";
import type { MeContextResponse } from "@/lib/http/me-context";

type ActivePharmacyContextValue = ReturnType<typeof useActivePharmacyContext>;

const ActivePharmacyCtx = createContext<ActivePharmacyContextValue | null>(null);

export function ActivePharmacyProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const value = useActivePharmacyContext({ enabled });
  return (
    <ActivePharmacyCtx.Provider value={value}>{children}</ActivePharmacyCtx.Provider>
  );
}

/** Returns null on platform admin routes (no ActivePharmacyProvider). */
export function useOptionalActivePharmacy() {
  return useContext(ActivePharmacyCtx);
}

export function useActivePharmacy() {
  const ctx = useOptionalActivePharmacy();
  if (!ctx) {
    throw new Error("useActivePharmacy must be used within ActivePharmacyProvider");
  }
  return ctx;
}

export type { MeContextResponse };
