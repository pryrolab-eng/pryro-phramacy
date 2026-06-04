import { fetchJson } from "./client";

export const insuranceReportsKey = (
  month: number,
  year: number,
  providerId?: string | null,
) =>
  ["reports", "insurance-claims", month, year, providerId ?? "all"] as const;

export type InsuranceClaimReportItem = {
  drug: string;
  quantity: number;
  unitPrice: number;
  insurancePays: number;
  patientPays: number;
  externalCode?: string | null;
};

export type InsuranceClaimReportRow = {
  id: string;
  claimNumber: string | null;
  insuranceType: string;
  providerId: string | null;
  patientName: string;
  insuranceNumber: string | null;
  date: string;
  status: string;
  totalClaim: number;
  patientCopay: number;
  items: InsuranceClaimReportItem[];
};

export type InsuranceClaimsReportResponse = {
  month: number;
  year: number;
  period: { from: string; to: string };
  pharmacy: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
  };
  claims: InsuranceClaimReportRow[];
  summary: {
    totalClaims: number;
    totalAmount: number;
    totalPatientCopay: number;
    byInsurance: Record<string, number>;
    byInsuranceDetail?: Record<
      string,
      { count: number; insurerAmount: number; patientCopay: number }
    >;
  };
  template: {
    id: string;
    name: string;
    insurance_provider: string;
  } | null;
  renderedHtml: string | null;
  renderedCss: string | null;
};

export async function getInsuranceClaimsReport(params: {
  month: number;
  year: number;
  providerId?: string | null;
}): Promise<InsuranceClaimsReportResponse> {
  const qs = new URLSearchParams({
    month: String(params.month),
    year: String(params.year),
  });
  if (params.providerId) {
    qs.set("providerId", params.providerId);
  }
  return fetchJson<InsuranceClaimsReportResponse>(
    `/api/reports/insurance-claims?${qs}`,
  );
}
