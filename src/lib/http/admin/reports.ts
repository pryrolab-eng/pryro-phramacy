import { fetchJson } from "../client";

export const adminReportsSummaryQueryKey = [
  "admin",
  "reports",
  "summary",
] as const;

/** Downloadable / generated report surfaced to admins (from API when implemented). */
export type ExportableReport = {
  id: string;
  name: string;
  description?: string | null;
  lastGenerated?: string | null;
  category?: string | null;
  /** Signed URL or same-origin path; when set, Download is enabled. */
  downloadUrl?: string | null;
};

export type AdminReportsSummary = {
  /** Sum of completed payments (payments + payment_transactions tables). */
  totalRevenue: number;
  /** Active subscriptions × catalog plan price (not cash collected). */
  estimatedMrr: number;
  completedPaymentCount: number;
  pendingPaymentCount: number;
  activePharmacies: number;
  totalUsers: number;
  revenueData: { month: string; revenue: number; pharmacies: number }[];
  planBreakdown: { plan_name: string; subscribers: number; revenue: number }[];
  /** Empty until the backend stores or builds exportable artifacts. */
  exportableReports: ExportableReport[];
};

export async function getAdminReportsSummary(): Promise<AdminReportsSummary> {
  return fetchJson<AdminReportsSummary>("/api/admin/reports-summary");
}

export async function uploadPlatformAdminReport(input: {
  file: File;
  name?: string;
  description?: string;
  category?: string;
}): Promise<{ id: string }> {
  const form = new FormData();
  form.set("file", input.file);
  if (input.name?.trim()) form.set("name", input.name.trim());
  if (input.description?.trim()) form.set("description", input.description.trim());
  if (input.category?.trim()) form.set("category", input.category.trim());
  return fetchJson<{ id: string }>("/api/admin/reports", {
    method: "POST",
    body: form,
  });
}
