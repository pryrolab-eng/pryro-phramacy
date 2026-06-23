import { isPrismaConfigured } from "@/lib/db/is-prisma-configured";
import {
  createPrescriptionFromDb,
  deletePrescriptionFromDb,
  listPrescriptionsForPharmacyFromDb,
  prescriptionExistsInPharmacyFromDb,
  updatePrescriptionFromDb,
  type PrescriptionRow,
} from "@/lib/db/prescriptions";

function requirePrisma(): void {
  if (!isPrismaConfigured()) {
    throw new Error("DATABASE_URL is required for prescriptions (Prisma)");
  }
}

export type { PrescriptionRow };

export async function storeListPrescriptions(
  pharmacyId: string,
): Promise<PrescriptionRow[]> {
  requirePrisma();
  return listPrescriptionsForPharmacyFromDb(pharmacyId);
}

export async function storePrescriptionInPharmacy(
  prescriptionId: string,
  pharmacyId: string,
): Promise<boolean> {
  requirePrisma();
  return prescriptionExistsInPharmacyFromDb(prescriptionId, pharmacyId);
}

export async function storeCreatePrescription(
  input: Parameters<typeof createPrescriptionFromDb>[0],
): Promise<PrescriptionRow> {
  requirePrisma();
  return createPrescriptionFromDb(input);
}

export async function storeUpdatePrescription(
  prescriptionId: string,
  pharmacyId: string,
  input: Parameters<typeof updatePrescriptionFromDb>[2],
): Promise<PrescriptionRow | null> {
  requirePrisma();
  return updatePrescriptionFromDb(prescriptionId, pharmacyId, input);
}

export async function storeDeletePrescription(
  prescriptionId: string,
  pharmacyId: string,
): Promise<boolean> {
  requirePrisma();
  return deletePrescriptionFromDb(prescriptionId, pharmacyId);
}
