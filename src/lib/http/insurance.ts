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

export type UpdateInsuranceProviderInput = {
  name?: string;
  coverage_percentage?: number;
  default_coverage_percent?: number;
  contact_email?: string | null;
  contact_phone?: string | null;
  policy_number?: string | null;
  is_active?: boolean;
};

type UpdateInsuranceResponse = {
  success: boolean;
  insurance?: InsuranceProviderRow;
  message?: string;
  error?: string;
};

/** `PATCH /api/insurance/[id]` — update provider (platform admin or pharmacy owner for own). */
export async function updateInsuranceProvider(
  id: string,
  body: UpdateInsuranceProviderInput,
): Promise<UpdateInsuranceResponse> {
  const data = await fetchJson<UpdateInsuranceResponse>(`/api/insurance/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  ensureApiSuccess(data, "Failed to update insurance provider");
  return data;
}

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

export type UploadInsurancePricingResult = {
  success: boolean;
  upserted: number;
  errors?: string[];
};

export async function uploadInsurancePricing(
  body: UploadInsurancePricingInput,
): Promise<UploadInsurancePricingResult> {
  return fetchJson<UploadInsurancePricingResult>("/api/insurance/pricing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type ApplyFormularyCoverageInput = {
  insurance: string;
  items: Array<{
    medicationId: string;
    externalCode?: string;
  }>;
};

export type ApplyFormularyCoverageResult = {
  success: boolean;
  applied: number;
  failures?: Array<{ medicationId: string; error: string }>;
  error?: string;
};

export async function applyFormularyCoverage(
  body: ApplyFormularyCoverageInput,
): Promise<ApplyFormularyCoverageResult> {
  return fetchJson<ApplyFormularyCoverageResult>(
    "/api/insurance/formulary/apply",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
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
  patientName?: string;
  totalAmount: number;
  insuranceCoverage: number;
  patientCopay: number;
  saleId?: string;
  metadata?: Record<string, unknown>;
  lines?: Array<{
    inventoryId?: string;
    medicationId: string;
    medicationName?: string;
    quantity: number;
    shelfUnitPrice: number;
  }>;
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

export type ClaimStatus = "pending" | "processing" | "approved" | "rejected";

export type UpdateClaimStatusInput = {
  claimId: string;
  status: ClaimStatus;
  notes?: string;
  approvedAmount?: number;
};

export type UpdateClaimStatusResult = {
  success: boolean;
  claim: {
    id: string;
    status: string;
    approved_amount: number | null;
    processed_at: string | null;
    notes: string | null;
  };
};

export async function updateClaimStatus(
  input: UpdateClaimStatusInput,
): Promise<UpdateClaimStatusResult> {
  const { claimId, ...body } = input;
  return fetchJson<UpdateClaimStatusResult>(
    `/api/insurance/claims/${claimId}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}
