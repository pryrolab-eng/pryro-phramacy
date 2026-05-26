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

export const insurancePosKeys = {
  pricing: (insurance: string, product: string) =>
    ["insurance", "pricing", insurance, product] as const,
};

export type InsurancePricingResponse = { price: number | null };

export async function getInsurancePricing(
  insurance: string,
  product: string,
): Promise<InsurancePricingResponse> {
  return fetchJson<InsurancePricingResponse>(
    `/api/insurance/pricing?insurance=${encodeURIComponent(insurance)}&product=${encodeURIComponent(product)}`,
  );
}

export type UploadInsurancePricingInput = {
  insurance: string;
  priceList: Record<string, number>;
};

export async function uploadInsurancePricing(
  body: UploadInsurancePricingInput,
): Promise<void> {
  await fetchJson("/api/insurance/pricing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type InsuranceLookupResult = {
  success: boolean;
  insuranceType?: string;
  coveragePercent?: number;
};

export async function lookupInsurance(
  insuranceNumber: string,
): Promise<InsuranceLookupResult> {
  return fetchJson<InsuranceLookupResult>("/api/insurance/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ insuranceNumber }),
  });
}

export type InsuranceProcessPayload = {
  insuranceType: string;
  patientId: string;
  totalAmount: number;
  insuranceCoverage: number;
  patientCopay: number;
};

export type InsuranceProcessResult = {
  success: boolean;
  claim?: { claimId: string; approvalCode: string };
};

export async function processInsuranceClaim(
  payload: InsuranceProcessPayload,
): Promise<InsuranceProcessResult> {
  return fetchJson<InsuranceProcessResult>("/api/insurance/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
