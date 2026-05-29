import { fetchJson } from "./client";

export type StaffBranchAccess = {
  pharmacyUserId: string;
  branchIds: string[];
  unrestricted: boolean;
};

export async function getStaffBranchAccess(
  pharmacyUserId: string,
): Promise<StaffBranchAccess> {
  return fetchJson<StaffBranchAccess>(`/api/staff/${pharmacyUserId}/branches`);
}

export async function updateStaffBranchAccess(
  pharmacyUserId: string,
  branchIds: string[],
): Promise<StaffBranchAccess> {
  return fetchJson<StaffBranchAccess>(`/api/staff/${pharmacyUserId}/branches`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ branchIds }),
  });
}
