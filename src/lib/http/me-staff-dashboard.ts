import { fetchJson } from "./client";

export type StaffDashboardMetric = {
  key: string;
  label: string;
  value: number | string;
  hint?: string;
};

export type StaffDashboardSummary = {
  role: string | null;
  metrics: StaffDashboardMetric[];
};

export const meStaffDashboardQueryKey = ["me", "staff-dashboard"] as const;

export async function getStaffDashboardSummary(): Promise<StaffDashboardSummary> {
  return fetchJson<StaffDashboardSummary>("/api/me/staff-dashboard");
}
