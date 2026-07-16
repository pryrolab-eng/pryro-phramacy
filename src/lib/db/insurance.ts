import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { ClaimLineInsertRow } from "@/lib/insurance/claim-lines";

export type ResolvedInsuranceProvider = {
  id: string;
  name: string;
  coveragePercent: number;
  integrationType: string;
};

function decimal(value: Prisma.Decimal | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

function mapResolvedProvider(row: {
  id: string;
  name: string;
  coverage_percentage: Prisma.Decimal | null;
  default_coverage_percent: Prisma.Decimal | null;
  integration_type: string;
}): ResolvedInsuranceProvider {
  return {
    id: row.id,
    name: row.name,
    coveragePercent: Number(
      row.default_coverage_percent ?? row.coverage_percentage ?? 0,
    ),
    integrationType: row.integration_type ?? "manual",
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function listGlobalInsuranceProvidersFromDb() {
  return prisma.insurance_providers.findMany({
    where: { pharmacy_id: null, is_active: true },
    orderBy: { name: "asc" },
  });
}

export async function listAllInsuranceProvidersFromDb() {
  return prisma.insurance_providers.findMany({
    orderBy: { created_at: "desc" },
  });
}

export async function listPharmacyInsuranceProvidersFromDb(pharmacyId: string) {
  return prisma.insurance_providers.findMany({
    where: {
      is_active: true,
      OR: [{ pharmacy_id: pharmacyId }, { pharmacy_id: null }],
    },
    orderBy: { name: "asc" },
  });
}

export type InsuranceProviderCreateInput = {
  pharmacyId: string | null;
  name: string;
  coveragePercentage: number;
  contactEmail?: string | null;
  contactPhone?: string | null;
  policyNumber?: string | null;
};

export async function createInsuranceProviderFromDb(
  input: InsuranceProviderCreateInput,
) {
  return prisma.insurance_providers.create({
    data: {
      pharmacy_id: input.pharmacyId,
      name: input.name,
      coverage_percentage: input.coveragePercentage,
      default_coverage_percent: input.coveragePercentage,
      contact_email: input.contactEmail ?? null,
      contact_phone: input.contactPhone ?? null,
      policy_number: input.policyNumber ?? null,
      is_active: true,
    },
  });
}

export async function findInsuranceProviderByIdFromDb(id: string) {
  return prisma.insurance_providers.findUnique({
    where: { id },
    select: { id: true, pharmacy_id: true, name: true },
  });
}

export async function updateInsuranceProviderFromDb(
  id: string,
  updates: Prisma.insurance_providersUpdateInput,
) {
  return prisma.insurance_providers.update({
    where: { id },
    data: { ...updates, updated_at: new Date() },
  });
}

export async function resolveInsuranceProviderFromDb(
  pharmacyId: string,
  providerIdOrName: string,
): Promise<ResolvedInsuranceProvider | null> {
  const key = providerIdOrName.trim();
  if (!key) return null;

  // First try exact ID match
  if (isUuid(key)) {
    const row = await prisma.insurance_providers.findUnique({
      where: { id: key, is_active: true },
      select: {
        id: true,
        name: true,
        coverage_percentage: true,
        default_coverage_percent: true,
        integration_type: true,
      },
    });
    return row ? mapResolvedProvider(row) : null;
  }

  // For name lookup, prefer pharmacy-scoped over global
  const pharmacyScoped = await prisma.insurance_providers.findFirst({
    where: {
      is_active: true,
      pharmacy_id: pharmacyId,
      name: { equals: key, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      coverage_percentage: true,
      default_coverage_percent: true,
      integration_type: true,
    },
  });

  if (pharmacyScoped) return mapResolvedProvider(pharmacyScoped);

  // Fallback to global provider
  const global = await prisma.insurance_providers.findFirst({
    where: {
      is_active: true,
      pharmacy_id: null,
      name: { equals: key, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      coverage_percentage: true,
      default_coverage_percent: true,
      integration_type: true,
    },
  });

  return global ? mapResolvedProvider(global) : null;
}

export async function resolveGlobalInsuranceProviderFromDb(
  providerIdOrName: string,
): Promise<ResolvedInsuranceProvider | null> {
  const key = providerIdOrName.trim();
  if (!key) return null;

  const row = await prisma.insurance_providers.findFirst({
    where: {
      is_active: true,
      pharmacy_id: null,
      ...(isUuid(key)
        ? { id: key }
        : { name: { equals: key, mode: "insensitive" } }),
    },
    select: {
      id: true,
      name: true,
      coverage_percentage: true,
      default_coverage_percent: true,
      integration_type: true,
    },
  });

  return row ? mapResolvedProvider(row) : null;
}

export async function loadMedicationInsuranceCoverageFromDb(
  pharmacyId: string,
  medicationIds: string[],
) {
  const ids = Array.from(new Set(medicationIds.filter(Boolean)));
  if (ids.length === 0) return [];

  return prisma.medications.findMany({
    where: { pharmacy_id: pharmacyId, id: { in: ids } },
    select: { id: true, insurance_coverage: true },
  });
}

export async function findMedicationByNameFromDb(
  pharmacyId: string,
  name: string,
) {
  return prisma.medications.findFirst({
    where: {
      pharmacy_id: pharmacyId,
      name: { equals: name.trim(), mode: "insensitive" },
    },
    select: { id: true, name: true, insurance_coverage: true },
  });
}

export async function findMedicationForCoverageFromDb(
  pharmacyId: string,
  medicationId: string,
) {
  return prisma.medications.findFirst({
    where: { pharmacy_id: pharmacyId, id: medicationId },
    select: { id: true, name: true, insurance_coverage: true },
  });
}

export async function listActiveMedicationsForCoverageFromDb(
  pharmacyId: string,
  search?: string,
) {
  return prisma.medications.findMany({
    where: {
      pharmacy_id: pharmacyId,
      is_active: true,
      ...(search?.trim()
        ? { name: { contains: search.trim(), mode: "insensitive" } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      category: true,
      insurance_coverage: true,
    },
    orderBy: { name: "asc" },
    take: 500,
  });
}

export async function findInsuranceProviderByNameFromDb(
  pharmacyId: string,
  namePattern: string,
) {
  const pattern = namePattern.trim();
  if (!pattern) return null;

  return prisma.insurance_providers.findFirst({
    where: {
      is_active: true,
      OR: [{ pharmacy_id: pharmacyId }, { pharmacy_id: null }],
      name: { contains: pattern, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      coverage_percentage: true,
      default_coverage_percent: true,
    },
  });
}

export async function loadPharmacyInvoiceContextFromDb(pharmacyId: string) {
  return prisma.pharmacies.findUnique({
    where: { id: pharmacyId },
    select: {
      name: true,
      address: true,
      phone: true,
      rra_tin: true,
    },
  });
}

export async function findInventorySellingPriceFromDb(
  pharmacyId: string,
  medicationId: string,
) {
  const row = await prisma.inventory.findFirst({
    where: {
      pharmacy_id: pharmacyId,
      medication_id: medicationId,
      quantity_in_stock: { gt: 0 },
    },
    select: { selling_price: true },
    orderBy: { created_at: "desc" },
  });

  return row ? decimal(row.selling_price) : 0;
}

export async function updateMedicationInsuranceCoverageFromDb(input: {
  medicationId: string;
  pharmacyId: string;
  coverage: Prisma.InputJsonValue;
}) {
  await prisma.medications.update({
    where: { id: input.medicationId },
    data: {
      insurance_coverage: input.coverage,
      updated_at: new Date(),
    },
  });
}

export async function createInsuranceClaimFromDb(input: {
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
  return prisma.insurance_claims.create({
    data: {
      pharmacy_id: input.pharmacyId,
      sale_id: input.saleId ?? null,
      insurance_provider_id: input.providerId,
      patient_name: input.patientName,
      patient_id_number: input.patientIdNumber ?? null,
      claim_amount: input.claimAmount,
      covered_amount: input.coveredAmount,
      patient_copay: input.patientCopay,
      approved_amount: 0,
      status: "pending",
      notes: input.notes ?? null,
      metadata: input.metadata as Prisma.InputJsonValue,
    },
    select: { id: true, claim_number: true, status: true },
  });
}

export async function insertInsuranceClaimLinesFromDb(
  rows: ClaimLineInsertRow[],
): Promise<void> {
  if (rows.length === 0) return;

  await prisma.insurance_claim_lines.createMany({
    data: rows.map((row) => ({
      claim_id: row.claim_id,
      sale_item_id: row.sale_item_id ?? null,
      medication_id: row.medication_id,
      medication_name: row.medication_name,
      quantity: row.quantity,
      is_covered: row.is_covered,
      shelf_unit_price: row.shelf_unit_price,
      insured_unit_price: row.insured_unit_price,
      insurer_amount: row.insurer_amount,
      patient_amount: row.patient_amount,
      external_code: row.external_code,
    })),
  });
}

export async function findCustomerByInsuranceNumberFromDb(
  pharmacyId: string,
  insuranceNumber: string,
) {
  return prisma.customers.findFirst({
    where: {
      pharmacy_id: pharmacyId,
      insurance_number: insuranceNumber,
    },
    select: {
      id: true,
      name: true,
      phone: true,
      insurance_number: true,
      insurance_provider_id: true,
    },
  });
}

export async function loadPharmacyForReportFromDb(pharmacyId: string) {
  return prisma.pharmacies.findUnique({
    where: { id: pharmacyId },
    select: { id: true, name: true, address: true, phone: true, email: true },
  });
}

export async function loadMonthlyInsuranceClaimsFromDb(input: {
  pharmacyId: string;
  from: string;
  to: string;
  providerId?: string | null;
}) {
  return prisma.insurance_claims.findMany({
    where: {
      pharmacy_id: input.pharmacyId,
      created_at: {
        gte: new Date(input.from),
        lte: new Date(input.to),
      },
      ...(input.providerId
        ? { insurance_provider_id: input.providerId }
        : {}),
    },
    orderBy: { created_at: "asc" },
    include: {
      insurance_providers: { select: { id: true, name: true } },
      insurance_claim_lines: {
        select: {
          medication_name: true,
          quantity: true,
          shelf_unit_price: true,
          insurer_amount: true,
          patient_amount: true,
          is_covered: true,
          external_code: true,
        },
      },
    },
  });
}

export async function loadSaleItemsForClaimFromDb(saleId: string) {
  const rows = await prisma.sale_items.findMany({
    where: { sale_id: saleId },
    select: {
      medication_name: true,
      quantity: true,
      unit_price: true,
      total_price: true,
    },
  });

  return rows.map((row) => {
    const qty = row.quantity || 1;
    const unit = decimal(row.unit_price);
    const total = decimal(row.total_price) || unit * qty;
    return {
      drug: row.medication_name ?? "Unknown",
      quantity: qty,
      unitPrice: unit,
      insurancePays: total,
      patientPays: 0,
    };
  });
}

export async function loadInsuranceTemplateForProviderFromDb(
  providerName: string,
  pharmacyId: string,
) {
  const key = providerName.trim();
  if (!key) return null;

  const rows = await prisma.insurance_templates.findMany({
    where: {
      is_active: true,
      OR: [{ pharmacy_id: null }, { pharmacy_id: pharmacyId }],
    },
    select: {
      id: true,
      name: true,
      insurance_provider: true,
      template_html: true,
      template_css: true,
      pharmacy_id: true,
    },
    orderBy: { pharmacy_id: { sort: "desc", nulls: "last" } },
  });

  const match = rows.find(
    (row) =>
      row.insurance_provider.trim().toLowerCase() === key.toLowerCase(),
  );

  if (!match) return null;

  return {
    id: match.id,
    name: match.name,
    insurance_provider: match.insurance_provider,
    template_html: match.template_html ?? "",
    template_css: match.template_css ?? "",
  };
}
