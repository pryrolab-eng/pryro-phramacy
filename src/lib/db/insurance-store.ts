import type { Prisma } from "@prisma/client";
import { buildClaimLineRows } from "@/lib/insurance/claim-lines";
import { parseMedicationInsuranceCoverage } from "@/lib/insurance/medication-coverage";
import type { CoverageLineResult } from "@/lib/insurance/types";
import {
  createInsuranceClaimFromDb,
  createInsuranceProviderFromDb,
  findCustomerByInsuranceNumberFromDb,
  findInsuranceProviderByIdFromDb,
  findInventorySellingPriceFromDb,
  findMedicationByNameFromDb,
  insertInsuranceClaimLinesFromDb,
  listAllInsuranceProvidersFromDb,
  listGlobalInsuranceProvidersFromDb,
  listPharmacyInsuranceProvidersFromDb,
  loadInsuranceTemplateForProviderFromDb,
  loadMedicationInsuranceCoverageFromDb,
  loadMonthlyInsuranceClaimsFromDb,
  loadPharmacyForReportFromDb,
  loadSaleItemsForClaimFromDb,
  resolveGlobalInsuranceProviderFromDb,
  resolveInsuranceProviderFromDb,
  updateInsuranceProviderFromDb,
  updateMedicationInsuranceCoverageFromDb,
  type InsuranceProviderCreateInput,
  type ResolvedInsuranceProvider,
} from "@/lib/db/insurance";

export type { ResolvedInsuranceProvider };

export async function storeListGlobalInsuranceProviders() {
  return listGlobalInsuranceProvidersFromDb();
}

export async function storeListAllInsuranceProviders() {
  return listAllInsuranceProvidersFromDb();
}

export async function storeListPharmacyInsuranceProviders(pharmacyId: string) {
  return listPharmacyInsuranceProvidersFromDb(pharmacyId);
}

export async function storeCreateInsuranceProvider(
  input: InsuranceProviderCreateInput & {
    invoiceTemplate?: string;
    templateConfig?: Record<string, unknown>;
  },
) {
  return createInsuranceProviderFromDb(input);
}

export async function storeFindInsuranceProviderById(id: string) {
  return findInsuranceProviderByIdFromDb(id);
}

export async function storeUpdateInsuranceProvider(
  id: string,
  updates: Record<string, unknown>,
) {
  const prismaUpdates: Prisma.insurance_providersUpdateInput = {};
  if (updates.name !== undefined) prismaUpdates.name = String(updates.name);
  if (updates.coverage_percentage !== undefined) {
    prismaUpdates.coverage_percentage = Number(updates.coverage_percentage);
  }
  if (updates.default_coverage_percent !== undefined) {
    prismaUpdates.default_coverage_percent = Number(
      updates.default_coverage_percent,
    );
  }
  if (updates.contact_email !== undefined) {
    prismaUpdates.contact_email = updates.contact_email as string | null;
  }
  if (updates.contact_phone !== undefined) {
    prismaUpdates.contact_phone = updates.contact_phone as string | null;
  }
  if (updates.policy_number !== undefined) {
    prismaUpdates.policy_number = updates.policy_number as string | null;
  }
  if (updates.is_active !== undefined) {
    prismaUpdates.is_active = Boolean(updates.is_active);
  }

  return updateInsuranceProviderFromDb(id, prismaUpdates);
}

export async function storeResolveInsuranceProvider(
  pharmacyId: string,
  providerIdOrName: string,
): Promise<ResolvedInsuranceProvider | null> {
  return resolveInsuranceProviderFromDb(pharmacyId, providerIdOrName);
}

export async function storeResolveGlobalInsuranceProvider(
  providerIdOrName: string,
): Promise<ResolvedInsuranceProvider | null> {
  return resolveGlobalInsuranceProviderFromDb(providerIdOrName);
}

export async function storeLoadMedicationInsuranceCoverage(
  pharmacyId: string,
  medicationIds: string[],
): Promise<Map<string, ReturnType<typeof parseMedicationInsuranceCoverage>>> {
  const map = new Map<
    string,
    ReturnType<typeof parseMedicationInsuranceCoverage>
  >();
  const ids = Array.from(new Set(medicationIds.filter(Boolean)));
  if (ids.length === 0) return map;

  const rows = await loadMedicationInsuranceCoverageFromDb(pharmacyId, ids);
  for (const row of rows) {
    map.set(row.id, parseMedicationInsuranceCoverage(row.insurance_coverage));
  }
  return map;
}

export async function storeLoadExternalCodesByMedication(
  pharmacyId: string,
  providerId: string,
  medicationIds: string[],
): Promise<Map<string, string | null>> {
  const coverageMap = await storeLoadMedicationInsuranceCoverage(
    pharmacyId,
    medicationIds,
  );
  const map = new Map<string, string | null>();

  coverageMap.forEach((coverage, medId) => {
    const entry = coverage[providerId];
    const code = entry?.externalCode?.trim();
    map.set(medId, code || null);
  });

  return map;
}

export async function storeFindMedicationByName(
  pharmacyId: string,
  name: string,
) {
  return findMedicationByNameFromDb(pharmacyId, name);
}

export async function storeFindInventorySellingPrice(
  pharmacyId: string,
  medicationId: string,
): Promise<number> {
  return findInventorySellingPriceFromDb(pharmacyId, medicationId);
}

export async function storeUpdateMedicationInsuranceCoverage(input: {
  medicationId: string;
  pharmacyId: string;
  coverage: ReturnType<typeof parseMedicationInsuranceCoverage>;
}): Promise<void> {
  await updateMedicationInsuranceCoverageFromDb({
    medicationId: input.medicationId,
    pharmacyId: input.pharmacyId,
    coverage: input.coverage as Prisma.InputJsonValue,
  });
}

export async function storeCreateInsuranceClaim(input: {
  pharmacyId: string;
  saleId?: string | null;
  providerId: string;
  patientName: string;
  patientIdNumber?: string | null;
  claimAmount: number;
  coveredAmount: number;
  patientCopay: number;
  notes?: string | null;
  metadata: Record<string, unknown>;
}) {
  return createInsuranceClaimFromDb(input);
}

export async function storeInsertInsuranceClaimLines(params: {
  claimId: string;
  pharmacyId: string;
  providerId: string;
  lines: CoverageLineResult[];
  saleItemIdByInventoryId?: Map<string, string>;
}): Promise<void> {
  if (params.lines.length === 0) return;

  const medIds = params.lines.map((line) => line.medicationId);
  const externalByMedication = await storeLoadExternalCodesByMedication(
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

  await insertInsuranceClaimLinesFromDb(rows);
}

export async function storeFindCustomerByInsuranceNumber(
  pharmacyId: string,
  insuranceNumber: string,
) {
  return findCustomerByInsuranceNumberFromDb(pharmacyId, insuranceNumber);
}

export async function storeLoadPharmacyForReport(pharmacyId: string) {
  return loadPharmacyForReportFromDb(pharmacyId);
}

export type NormalizedMonthlyClaimRow = {
  id: string;
  claim_number: string | null;
  patient_name: string;
  patient_id_number: string | null;
  claim_amount: number;
  covered_amount: number | null;
  patient_copay: number | null;
  status: string;
  created_at: string;
  sale_id: string | null;
  insurance_provider_id: string | null;
  provider_name: string;
  lines: Array<{
    medication_name: string | null;
    quantity: number;
    shelf_unit_price: number;
    insurer_amount: number;
    patient_amount: number;
    external_code: string | null;
  }>;
};

function normalizePrismaMonthlyClaim(
  row: Awaited<ReturnType<typeof loadMonthlyInsuranceClaimsFromDb>>[number],
): NormalizedMonthlyClaimRow {
  return {
    id: row.id,
    claim_number: row.claim_number,
    patient_name: row.patient_name,
    patient_id_number: row.patient_id_number,
    claim_amount: Number(row.claim_amount),
    covered_amount: row.covered_amount != null ? Number(row.covered_amount) : null,
    patient_copay: row.patient_copay != null ? Number(row.patient_copay) : null,
    status: String(row.status ?? "pending"),
    created_at: row.created_at?.toISOString() ?? new Date().toISOString(),
    sale_id: row.sale_id,
    insurance_provider_id: row.insurance_provider_id,
    provider_name: row.insurance_providers?.name ?? "Unknown",
    lines: row.insurance_claim_lines.map((line) => ({
      medication_name: line.medication_name,
      quantity: line.quantity,
      shelf_unit_price: Number(line.shelf_unit_price),
      insurer_amount: Number(line.insurer_amount),
      patient_amount: Number(line.patient_amount),
      external_code: line.external_code,
    })),
  };
}

export async function storeLoadMonthlyInsuranceClaims(input: {
  pharmacyId: string;
  from: string;
  to: string;
  providerId?: string | null;
}): Promise<NormalizedMonthlyClaimRow[]> {
  const rows = await loadMonthlyInsuranceClaimsFromDb(input);
  return rows.map(normalizePrismaMonthlyClaim);
}

export async function storeLoadSaleItemsForClaim(saleId: string | null) {
  if (!saleId) return [];
  return loadSaleItemsForClaimFromDb(saleId);
}

export async function storeLoadInsuranceTemplateForProvider(
  providerName: string,
  pharmacyId: string,
) {
  return loadInsuranceTemplateForProviderFromDb(providerName, pharmacyId);
}
