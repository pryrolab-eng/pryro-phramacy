import {
  storeInsertInsuranceClaimLines,
  storeLoadExternalCodesByMedication,
} from "@/lib/db/insurance-store";
import type { CoverageLineResult } from "@/lib/insurance/types";

export async function loadExternalCodesByMedication(
  pharmacyId: string,
  providerId: string,
  medicationIds: string[],
): Promise<Map<string, string | null>> {
  return storeLoadExternalCodesByMedication(
    pharmacyId,
    providerId,
    medicationIds,
  );
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

export async function insertInsuranceClaimLines(params: {
  claimId: string;
  pharmacyId: string;
  providerId: string;
  lines: CoverageLineResult[];
  saleItemIdByInventoryId?: Map<string, string>;
}): Promise<void> {
  return storeInsertInsuranceClaimLines(params);
}
