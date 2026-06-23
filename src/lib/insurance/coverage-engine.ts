import {
  getMedicationProviderEntry,
  isProviderCoverageActive,
  parseMedicationInsuranceCoverage,
} from "@/lib/insurance/medication-coverage";
import { storeResolveInsuranceProvider } from "@/lib/db/insurance-store";
import { storeLoadMedicationInsuranceCoverage } from "@/lib/db/insurance-store";
import type {
  CoverageLineInput,
  CoverageLineResult,
  CoverageTotals,
} from "@/lib/insurance/types";

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

export async function computeInsuranceCoverage(params: {
  pharmacyId: string;
  providerIdOrName: string;
  lines: CoverageLineInput[];
}): Promise<CoverageTotals | null> {
  const provider = await storeResolveInsuranceProvider(
    params.pharmacyId,
    params.providerIdOrName,
  );
  if (!provider) return null;

  const medIds = params.lines.map((line) => line.medicationId);
  const coverageMap = await storeLoadMedicationInsuranceCoverage(
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

  const insuranceCoverage = results.reduce((sum, row) => sum + row.insurerPays, 0);
  const patientCopay = results.reduce((sum, row) => sum + row.patientPays, 0);

  return {
    subtotal: insuranceCoverage + patientCopay,
    insuranceCoverage,
    patientCopay,
    lines: results,
  };
}
