"use client";

import { createContext, useContext, useState, useMemo, type ReactNode } from "react";
import type { BranchScopeValue } from "@/components/shell/branch-switcher";

type BranchScopeContextValue = {
  branchScope: BranchScopeValue;
  setBranchScope: (value: BranchScopeValue) => void;
};

const BranchScopeCtx = createContext<BranchScopeContextValue | null>(null);

export function BranchScopeProvider({ children }: { children: ReactNode }) {
  const [branchScope, setBranchScope] = useState<BranchScopeValue>("all");
  const value = useMemo(() => ({ branchScope, setBranchScope }), [branchScope]);
  return (
    <BranchScopeCtx.Provider value={value}>{children}</BranchScopeCtx.Provider>
  );
}

export function useBranchScope() {
  const ctx = useContext(BranchScopeCtx);
  if (!ctx) {
    throw new Error("useBranchScope must be used within BranchScopeProvider");
  }
  return ctx;
}
