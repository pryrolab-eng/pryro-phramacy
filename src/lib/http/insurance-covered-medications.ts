import { fetchJson } from "./client";

export const insuranceCoveredMedicationsKey = (
  providerId: string,
  search?: string,
) => ["insurance", "covered-medications", providerId, search ?? ""] as const;

export const medicationInsuranceCoverageKey = (medicationId: string) =>
  ["insurance", "medication-coverage", medicationId] as const;

export type MedicationInsuranceProviderRow = {
  id: string;
  name: string;
  coveragePercent: number;
  covered: boolean;
  externalCode: string | null;
};

export type MedicationInsuranceCoverageResponse = {
  medication: { id: string; name: string };
  providers: MedicationInsuranceProviderRow[];
};

export type InsuranceCoverageDraft = Record<
  string,
  { covered: boolean; externalCode: string }
>;

export function emptyInsuranceCoverageDraft(): InsuranceCoverageDraft {
  return {};
}

export function insuranceDraftFromProviders(
  providers: MedicationInsuranceProviderRow[],
): InsuranceCoverageDraft {
  const draft: InsuranceCoverageDraft = {};
  for (const p of providers) {
    draft[p.id] = {
      covered: p.covered,
      externalCode: p.externalCode ?? "",
    };
  }
  return draft;
}

export type InsuranceCoveredMedicationRow = {
  id: string;
  name: string;
  category: string | null;
  covered: boolean;
  externalCode: string | null;
  notes: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
};

export type InsuranceCoveredMedicationsResponse = {
  provider: {
    id: string;
    name: string;
    coveragePercent: number;
  };
  medications: InsuranceCoveredMedicationRow[];
};

export async function getInsuranceCoveredMedications(
  providerId: string,
  search?: string,
): Promise<InsuranceCoveredMedicationsResponse> {
  const params = new URLSearchParams({ providerId });
  if (search?.trim()) params.set("search", search.trim());
  return fetchJson<InsuranceCoveredMedicationsResponse>(
    `/api/pharmacy/insurance-covered-medications?${params}`,
  );
}

export type PatchInsuranceCoveredMedicationInput = {
  medicationId: string;
  providerId: string;
  covered: boolean;
  externalCode?: string | null;
  notes?: string | null;
};

export async function getMedicationInsuranceCoverage(
  medicationId: string,
): Promise<MedicationInsuranceCoverageResponse> {
  const params = new URLSearchParams({ medicationId });
  return fetchJson<MedicationInsuranceCoverageResponse>(
    `/api/pharmacy/insurance-covered-medications?${params}`,
  );
}

export async function patchInsuranceCoveredMedication(
  body: PatchInsuranceCoveredMedicationInput,
): Promise<void> {
  await fetchJson("/api/pharmacy/insurance-covered-medications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function applyInsuranceCoverageDraft(
  medicationId: string,
  draft: InsuranceCoverageDraft,
  options?: { syncAll?: boolean },
): Promise<void> {
  for (const [providerId, entry] of Object.entries(draft)) {
    if (
      !options?.syncAll &&
      !entry.covered &&
      !entry.externalCode.trim()
    ) {
      continue;
    }
    await patchInsuranceCoveredMedication({
      medicationId,
      providerId,
      covered: entry.covered,
      externalCode: entry.externalCode.trim() || null,
    });
  }
}
