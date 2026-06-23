import type { prescription_priority, prescription_status } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type PrescriptionRow = {
  id: string;
  pharmacy_id: string | null;
  patient_name: string;
  doctor_name: string;
  medications: string[];
  priority: prescription_priority | null;
  status: prescription_status | null;
  insurance_provider: string | null;
  notes: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

function normalizeMedications(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function parsePriority(value: unknown): prescription_priority {
  const allowed = new Set(["low", "medium", "high", "urgent"]);
  if (typeof value === "string" && allowed.has(value)) {
    return value as prescription_priority;
  }
  return "medium";
}

function parseStatus(value: unknown): prescription_status | undefined {
  const allowed = new Set(["pending", "dispensed", "completed", "cancelled"]);
  if (typeof value === "string" && allowed.has(value)) {
    return value as prescription_status;
  }
  return undefined;
}

export async function listPrescriptionsForPharmacyFromDb(
  pharmacyId: string,
): Promise<PrescriptionRow[]> {
  return prisma.prescriptions.findMany({
    where: { pharmacy_id: pharmacyId },
    orderBy: { created_at: "desc" },
  });
}

export async function prescriptionExistsInPharmacyFromDb(
  prescriptionId: string,
  pharmacyId: string,
): Promise<boolean> {
  const row = await prisma.prescriptions.findFirst({
    where: { id: prescriptionId, pharmacy_id: pharmacyId },
    select: { id: true },
  });
  return !!row;
}

export async function createPrescriptionFromDb(input: {
  pharmacyId: string;
  patientName: string;
  doctorName: string;
  medications: unknown;
  priority?: unknown;
  insuranceProvider?: string | null;
  notes?: string | null;
}): Promise<PrescriptionRow> {
  return prisma.prescriptions.create({
    data: {
      pharmacy_id: input.pharmacyId,
      patient_name: input.patientName,
      doctor_name: input.doctorName,
      medications: normalizeMedications(input.medications),
      priority: parsePriority(input.priority),
      status: "pending",
      insurance_provider: input.insuranceProvider ?? "None",
      notes: input.notes ?? null,
    },
  });
}

export async function updatePrescriptionFromDb(
  prescriptionId: string,
  pharmacyId: string,
  input: {
    patientName?: string;
    doctorName?: string;
    medications?: unknown;
    priority?: unknown;
    status?: unknown;
    insuranceProvider?: string | null;
    notes?: string | null;
  },
): Promise<PrescriptionRow | null> {
  const status = parseStatus(input.status);
  const result = await prisma.prescriptions.updateMany({
    where: { id: prescriptionId, pharmacy_id: pharmacyId },
    data: {
      ...(input.patientName !== undefined ? { patient_name: input.patientName } : {}),
      ...(input.doctorName !== undefined ? { doctor_name: input.doctorName } : {}),
      ...(input.medications !== undefined
        ? { medications: normalizeMedications(input.medications) }
        : {}),
      ...(input.priority !== undefined ? { priority: parsePriority(input.priority) } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(input.insuranceProvider !== undefined
        ? { insurance_provider: input.insuranceProvider }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      updated_at: new Date(),
    },
  });

  if (result.count === 0) return null;

  return prisma.prescriptions.findFirst({
    where: { id: prescriptionId, pharmacy_id: pharmacyId },
  });
}

export async function deletePrescriptionFromDb(
  prescriptionId: string,
  pharmacyId: string,
): Promise<boolean> {
  const result = await prisma.prescriptions.deleteMany({
    where: { id: prescriptionId, pharmacy_id: pharmacyId },
  });
  return result.count > 0;
}
