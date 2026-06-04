import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getMedicationProviderEntry,
  isProviderCoverageActive,
  parseMedicationInsuranceCoverage,
} from "@/lib/insurance/medication-coverage";
import { resolveInsuranceProvider } from "@/lib/insurance/resolve-provider";
import type {
  CoverageLineInput,
  CoverageLineResult,
  CoverageTotals,
} from "@/lib/insurance/types";

async function loadMedicationCoverageMap(
  admin: SupabaseClient,
  pharmacyId: string,
  medicationIds: string[],
): Promise<Map<string, ReturnType<typeof parseMedicationInsuranceCoverage>>> {
  const map = new Map<
    string,
    ReturnType<typeof parseMedicationInsuranceCoverage>
  >();
  if (medicationIds.length === 0) return map;

  const uniqueIds = Array.from(new Set(medicationIds.filter(Boolean)));
  const { data, error } = await admin
    .from("medications")
    .select("id, insurance_coverage")
    .eq("pharmacy_id", pharmacyId)
    .in("id", uniqueIds);

  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    map.set(
      row.id as string,
      parseMedicationInsuranceCoverage(row.insurance_coverage),
    );
  }

  return map;
}

function computeLine(
  line: CoverageLineInput,
  providerCoveragePercent: number,
  providerId: string,
  medicationCoverage:
    | ReturnType<typeof parseMedicationInsuranceCoverage>
    | undefined,
): CoverageLineResult {
  const qty = Math.max(0, line.quantity);
  const shelf = Math.max(0, line.shelfUnitPrice);
  const lineTotal = shelf * qty;

  const entry = medicationCoverage
    ? getMedicationProviderEntry(medicationCoverage, providerId)
    : undefined;

  if (!entry || !isProviderCoverageActive(entry)) {
    return {
      inventoryId: line.inventoryId,
      medicationId: line.medicationId,
      medicationName: line.medicationName,
      quantity: qty,
      isCovered: false,
      shelfUnitPrice: shelf,
      insuredUnitPrice: shelf,
      coveragePercent: 0,
      insurerPays: 0,
      patientPays: lineTotal,
      reason: "not_listed",
    };
  }

  if (entry.covered !== true) {
    return {
      inventoryId: line.inventoryId,
      medicationId: line.medicationId,
      medicationName: line.medicationName,
      quantity: qty,
      isCovered: false,
      shelfUnitPrice: shelf,
      insuredUnitPrice: shelf,
      coveragePercent: 0,
      insurerPays: 0,
      patientPays: lineTotal,
      reason: "not_covered",
    };
  }

  const pct = providerCoveragePercent / 100;
  const insurerPays = Math.round(lineTotal * pct);
  const patientPays = Math.max(0, lineTotal - insurerPays);

  return {
    inventoryId: line.inventoryId,
    medicationId: line.medicationId,
    medicationName: line.medicationName,
    quantity: qty,
    isCovered: pct > 0,
    shelfUnitPrice: shelf,
    insuredUnitPrice: shelf,
    coveragePercent: providerCoveragePercent,
    insurerPays,
    patientPays,
    reason: "covered",
  };
}

export async function computeInsuranceCoverage(
  admin: SupabaseClient,
  params: {
    pharmacyId: string;
    providerIdOrName: string;
    lines: CoverageLineInput[];
  },
): Promise<CoverageTotals | null> {
  const provider = await resolveInsuranceProvider(
    admin,
    params.pharmacyId,
    params.providerIdOrName,
  );
  if (!provider) return null;

  const medIds = params.lines.map((l) => l.medicationId);
  const coverageMap = await loadMedicationCoverageMap(
    admin,
    params.pharmacyId,
    medIds,
  );

  const results = params.lines.map((line) =>
    computeLine(
      line,
      provider.coveragePercent,
      provider.id,
      coverageMap.get(line.medicationId),
    ),
  );

  const insuranceCoverage = results.reduce((s, r) => s + r.insurerPays, 0);
  const patientCopay = results.reduce((s, r) => s + r.patientPays, 0);

  return {
    subtotal: insuranceCoverage + patientCopay,
    insuranceCoverage,
    patientCopay,
    lines: results,
  };
}
