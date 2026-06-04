import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getMedicationProviderEntry,
  parseMedicationInsuranceCoverage,
} from "@/lib/insurance/medication-coverage";
import type { CoverageLineResult } from "@/lib/insurance/types";

export async function loadExternalCodesByMedication(
  admin: SupabaseClient,
  pharmacyId: string,
  providerId: string,
  medicationIds: string[],
): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>();
  const ids = Array.from(new Set(medicationIds.filter(Boolean)));
  if (ids.length === 0) return map;

  const { data, error } = await admin
    .from("medications")
    .select("id, insurance_coverage")
    .eq("pharmacy_id", pharmacyId)
    .in("id", ids);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const coverage = parseMedicationInsuranceCoverage(row.insurance_coverage);
    const entry = getMedicationProviderEntry(coverage, providerId);
    const code = entry?.externalCode?.trim();
    map.set(row.id as string, code || null);
  }

  return map;
}

export type ClaimLineInsertRow = {
  claim_id: string;
  medication_id: string;
  medication_name: string | null;
  quantity: number;
  is_covered: boolean;
  shelf_unit_price: number;
  insured_unit_price: number;
  insurer_amount: number;
  patient_amount: number;
  external_code: string | null;
  sale_item_id?: string | null;
};

export function buildClaimLineRows(
  claimId: string,
  lines: CoverageLineResult[],
  externalByMedication: Map<string, string | null>,
  saleItemIdByInventoryId?: Map<string, string>,
): ClaimLineInsertRow[] {
  return lines
    .filter((line) => line.medicationId)
    .map((line) => ({
      claim_id: claimId,
      medication_id: line.medicationId,
      medication_name: line.medicationName ?? null,
      quantity: line.quantity,
      is_covered: line.isCovered,
      shelf_unit_price: line.shelfUnitPrice,
      insured_unit_price: line.insuredUnitPrice,
      insurer_amount: line.insurerPays,
      patient_amount: line.patientPays,
      external_code: externalByMedication.get(line.medicationId) ?? null,
      sale_item_id: line.inventoryId
        ? (saleItemIdByInventoryId?.get(line.inventoryId) ?? null)
        : null,
    }));
}

export async function insertInsuranceClaimLines(
  admin: SupabaseClient,
  params: {
    claimId: string;
    pharmacyId: string;
    providerId: string;
    lines: CoverageLineResult[];
    saleItemIdByInventoryId?: Map<string, string>;
  },
): Promise<void> {
  if (params.lines.length === 0) return;

  const medIds = params.lines.map((l) => l.medicationId);
  const externalByMedication = await loadExternalCodesByMedication(
    admin,
    params.pharmacyId,
    params.providerId,
    medIds,
  );
  const rows = buildClaimLineRows(
    params.claimId,
    params.lines,
    externalByMedication,
    params.saleItemIdByInventoryId,
  );

  const { error } = await admin.from("insurance_claim_lines").insert(rows);
  if (error) throw new Error(error.message);
}
