import { parseMedicationInsuranceCoverage } from "@/lib/insurance/medication-coverage";
import { isPrismaConfigured } from "@/lib/db/is-prisma-configured";
import {
  findMedicationForCoverageFromDb,
  listActiveMedicationsForCoverageFromDb,
  listPharmacyInsuranceProvidersFromDb,
  resolveInsuranceProviderFromDb,
  updateMedicationInsuranceCoverageFromDb,
} from "@/lib/db/insurance";
import type { Prisma } from "@prisma/client";
import type { MedicationInsuranceCoverageMap } from "@/lib/insurance/medication-coverage";

function requirePrisma(): void {
  if (!isPrismaConfigured()) {
    throw new Error("DATABASE_URL is required for insurance coverage (Prisma)");
  }
}

export async function storeGetMedicationCoverageDetail(
  pharmacyId: string,
  medicationId: string,
) {
  requirePrisma();
  const med = await findMedicationForCoverageFromDb(pharmacyId, medicationId);
  if (!med) return null;

  const providerRows = await listPharmacyInsuranceProvidersFromDb(pharmacyId);
  const coverage = parseMedicationInsuranceCoverage(med.insurance_coverage);

  const providers = providerRows.map((row) => {
    const entry = coverage[row.id];
    return {
      id: row.id,
      name: row.name,
      coveragePercent: Number(
        row.default_coverage_percent ?? row.coverage_percentage ?? 0,
      ),
      covered: entry?.covered === true,
      externalCode: entry?.externalCode ?? null,
    };
  });

  return {
    medication: { id: med.id, name: med.name },
    providers,
  };
}

export async function storeListMedicationsForProviderCoverage(
  pharmacyId: string,
  providerId: string,
  search?: string,
) {
  requirePrisma();
  const provider = await resolveInsuranceProviderFromDb(pharmacyId, providerId);
  if (!provider) return null;

  const medications = await listActiveMedicationsForCoverageFromDb(
    pharmacyId,
    search,
  );

  return {
    provider: {
      id: provider.id,
      name: provider.name,
      coveragePercent: provider.coveragePercent,
    },
    medications: medications.map((row) => {
      const coverage = parseMedicationInsuranceCoverage(row.insurance_coverage);
      const entry = coverage[provider.id];
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        covered: entry?.covered === true,
        externalCode: entry?.externalCode ?? null,
        notes: entry?.notes ?? null,
        effectiveFrom: entry?.effectiveFrom ?? null,
        effectiveTo: entry?.effectiveTo ?? null,
      };
    }),
  };
}

export async function storeResolveInsuranceProvider(
  pharmacyId: string,
  providerId: string,
) {
  requirePrisma();
  return resolveInsuranceProviderFromDb(pharmacyId, providerId);
}

export async function storeUpdateMedicationProviderCoverage(input: {
  pharmacyId: string;
  medicationId: string;
  providerId: string;
  coverage: MedicationInsuranceCoverageMap;
}): Promise<void> {
  requirePrisma();
  await updateMedicationInsuranceCoverageFromDb({
    pharmacyId: input.pharmacyId,
    medicationId: input.medicationId,
    coverage: input.coverage as Prisma.InputJsonValue,
  });
}
