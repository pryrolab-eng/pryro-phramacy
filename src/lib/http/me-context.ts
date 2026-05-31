import { fetchJson } from "./client";

export type MeContextMembership = {
  pharmacyId: string;
  pharmacyName: string | null;
  role: string;
  isActive: boolean;
};

export type MeContextResponse = {
  user: {
    id: string;
    email: string | null;
    fullName: string | null;
    isPlatformAdmin: boolean;
  };
  activePharmacyId: string | null;
  activeBranchId: string | null;
  role: string | null;
  /** null = all branches; array = restricted list */
  allowedBranchIds: string[] | null;
  /** RBAC capability keys from pharmacy_role_permissions */
  permissions: string[];
  /** True when user must replace a temporary invite password before using the app. */
  mustChangePassword: boolean;
  memberships: MeContextMembership[];
};

export const meContextKeys = {
  all: ["me", "context"] as const,
};

export async function getMeContext(): Promise<MeContextResponse> {
  return fetchJson<MeContextResponse>("/api/me/context");
}

export async function setActivePharmacy(pharmacyId: string) {
  return fetchJson<{
    success: boolean;
    activePharmacyId: string | null;
    activeBranchId: string | null;
    role: string | null;
  }>("/api/me/active-pharmacy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pharmacyId }),
  });
}

export async function setActiveBranch(branchId: string) {
  return fetchJson<{
    success: boolean;
    activePharmacyId: string | null;
    activeBranchId: string | null;
    role: string | null;
  }>("/api/me/active-branch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ branchId }),
  });
}
