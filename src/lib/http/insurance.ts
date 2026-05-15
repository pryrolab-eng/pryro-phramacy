import { ensureApiSuccess, fetchJson } from "./client";

export const insuranceProvidersQueryKey = ["insurance", "providers"] as const;

export type InsuranceProviderRow = Record<string, unknown> & {
  id: string;
  name?: string;
};

/** `GET /api/insurance` — list for current user / superadmin context. */
export async function getInsuranceProviders(): Promise<InsuranceProviderRow[]> {
  const data = await fetchJson<unknown>("/api/insurance");
  return Array.isArray(data) ? (data as InsuranceProviderRow[]) : [];
}

export type CreateInsuranceProviderInput = {
  name: string;
  coverage_percentage: number;
  contact_email?: string;
  contact_phone?: string;
  policy_number?: string;
  invoice_template?: string;
  template_config?: Record<string, unknown>;
};

type CreateInsuranceResponse = {
  success: boolean;
  insurance?: unknown;
  message?: string;
  error?: string;
};

/** `POST /api/insurance` — creates a provider (global for platform admin, scoped otherwise). */
export async function createInsuranceProvider(
  body: CreateInsuranceProviderInput,
): Promise<CreateInsuranceResponse> {
  const data = await fetchJson<CreateInsuranceResponse>("/api/insurance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  ensureApiSuccess(data, "Failed to add insurance provider");
  return data;
}
