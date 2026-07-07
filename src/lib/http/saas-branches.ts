import { fetchJson } from "./client";
import type { Branch, BranchUsage } from "@/lib/saas/types";

export type SaasBranchWithUsage = Branch & {
  usage: BranchUsage | null;
  /** True when this row exists in DB but exceeds plan branch slots (duplicate/orphan). */
  over_plan_limit?: boolean;
};

/** @deprecated Use `SaasBranchWithUsage` */
export type SaasBranchRow = SaasBranchWithUsage;

export type SaasBranchesResponse = {
  branches: SaasBranchWithUsage[];
};

export type UsageCheckResponse = {
  allowed: boolean;
  reason?: string;
  message?: string;
  tx_count?: number;
  tx_limit?: number;
  remaining?: number;
};

export const saasBranchesKeys = {
  all: ["saas", "branches"] as const,
  list: () => [...saasBranchesKeys.all, "list"] as const,
  usageCheck: (branchId: string) =>
    [...saasBranchesKeys.all, "usage-check", branchId] as const,
};

export async function getSaasBranches(): Promise<SaasBranchesResponse> {
  return fetchJson<SaasBranchesResponse>("/api/saas/branches");
}

export async function checkBranchTransactionAllowed(
  branchId: string,
): Promise<UsageCheckResponse> {
  return fetchJson<UsageCheckResponse>(
    `/api/saas/usage/check?branch_id=${encodeURIComponent(branchId)}`,
  );
}

export async function incrementBranchTransactionCount(
  branchId: string,
): Promise<void> {
  await fetchJson("/api/saas/usage/increment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ branch_id: branchId }),
  });
}

export type CreateSaasBranchInput = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
};

export async function createSaasBranch(
  params: CreateSaasBranchInput,
): Promise<SaasBranchWithUsage> {
  const data = await fetchJson<{ branch?: SaasBranchWithUsage; error?: string }>(
    "/api/saas/branches",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
  );
  if (!data.branch) {
    throw new Error(data.error || "Failed to create branch");
  }
  return data.branch;
}
