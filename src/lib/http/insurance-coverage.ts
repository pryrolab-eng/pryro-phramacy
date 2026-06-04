import { fetchJson } from "./client";
import type { CoverageLineResult } from "@/lib/insurance/types";

export const insuranceCoveragePreviewKey = (
  provider: string,
  lineKey: string,
) => ["insurance", "coverage-preview", provider, lineKey] as const;

export type InsuranceCoveragePreviewResult = {
  success: boolean;
  subtotal: number;
  insuranceCoverage: number;
  patientCopay: number;
  lines: CoverageLineResult[];
  error?: string;
};

export async function previewInsuranceCoverage(body: {
  insuranceType: string;
  lines: Array<{
    inventoryId?: string;
    medicationId: string;
    medicationName?: string;
    quantity: number;
    shelfUnitPrice: number;
  }>;
}): Promise<InsuranceCoveragePreviewResult> {
  return fetchJson<InsuranceCoveragePreviewResult>(
    "/api/insurance/coverage/preview",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        insuranceType: body.insuranceType,
        lines: body.lines,
      }),
    },
  );
}
