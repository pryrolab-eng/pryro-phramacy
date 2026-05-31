import { fetchJson } from "./client";

export type MeWorkplaceResponse = {
  pharmacy: {
    id: string;
    name: string;
    licenseNumber: string | null;
    location: string;
    phone: string | null;
    businessEmail: string | null;
  } | null;
  membership: {
    role: string | null;
    roleLabel: string;
  };
  branchAccess: {
    unrestricted: boolean;
    allowedBranchIds: string[] | null;
    branches: Array<{
      id: string;
      name: string;
      city: string | null;
      isMain: boolean;
    }>;
    activeBranch: {
      id: string;
      name: string;
      isMain: boolean;
    } | null;
  };
};

export const meWorkplaceQueryKey = ["me", "workplace"] as const;

export async function getMeWorkplace(): Promise<MeWorkplaceResponse> {
  return fetchJson<MeWorkplaceResponse>("/api/me/workplace");
}
