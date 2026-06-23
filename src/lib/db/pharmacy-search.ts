import { prisma } from "@/lib/db/prisma";
import type { PharmacyGlobalSearchResult } from "@/lib/search/types";

export async function searchPharmacyGlobal(
  pharmacyId: string,
  pattern: string,
): Promise<PharmacyGlobalSearchResult> {
  const [customers, meds, prescriptions, sales, staff, branches] = await Promise.all([
    prisma.customers.findMany({
      where: {
        pharmacy_id: pharmacyId,
        OR: [
          { name: { contains: pattern, mode: "insensitive" } },
          { phone: { contains: pattern, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, phone: true },
      take: 6,
    }),
    prisma.medications.findMany({
      where: {
        pharmacy_id: pharmacyId,
        OR: [
          { name: { contains: pattern, mode: "insensitive" } },
          { generic_name: { contains: pattern, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, category: true, generic_name: true },
      take: 6,
    }),
    prisma.prescriptions.findMany({
      where: {
        pharmacy_id: pharmacyId,
        OR: [
          { patient_name: { contains: pattern, mode: "insensitive" } },
          { doctor_name: { contains: pattern, mode: "insensitive" } },
        ],
      },
      select: { id: true, patient_name: true, doctor_name: true, status: true },
      take: 6,
    }),
    prisma.sales.findMany({
      where: {
        pharmacy_id: pharmacyId,
        status: "completed",
        OR: [
          { receipt_number: { contains: pattern, mode: "insensitive" } },
          { customer_name: { contains: pattern, mode: "insensitive" } },
          { customer_phone: { contains: pattern, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        receipt_number: true,
        customer_name: true,
        total_amount: true,
      },
      orderBy: { created_at: "desc" },
      take: 6,
    }),
    prisma.staff.findMany({
      where: {
        pharmacy_id: pharmacyId,
        OR: [
          { first_name: { contains: pattern, mode: "insensitive" } },
          { last_name: { contains: pattern, mode: "insensitive" } },
          { email: { contains: pattern, mode: "insensitive" } },
          { position: { contains: pattern, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        position: true,
      },
      take: 6,
    }),
    prisma.branches.findMany({
      where: {
        pharmacy_id: pharmacyId,
        OR: [
          { name: { contains: pattern, mode: "insensitive" } },
          { address: { contains: pattern, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, address: true, is_active: true },
      take: 6,
    }),
  ]);

  const medicationIds = meds.map((m) => m.id);
  const inventoryByMedication = new Map<string, string>();

  if (medicationIds.length > 0) {
    const inventoryRows = await prisma.inventory.findMany({
      where: {
        pharmacy_id: pharmacyId,
        medication_id: { in: medicationIds },
      },
      select: { id: true, medication_id: true },
      take: 50,
    });

    for (const row of inventoryRows) {
      if (row.medication_id && !inventoryByMedication.has(row.medication_id)) {
        inventoryByMedication.set(row.medication_id, row.id);
      }
    }
  }

  return {
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
    })),
    products: meds.map((m) => ({
      id: inventoryByMedication.get(m.id) ?? m.id,
      medicationId: m.id,
      name: m.name,
      category: m.category ?? m.generic_name,
    })),
    prescriptions: prescriptions.map((p) => ({
      id: p.id,
      patient: p.patient_name,
      doctor: p.doctor_name,
      status: p.status,
    })),
    sales: sales.map((s) => ({
      id: s.id,
      receiptNumber: s.receipt_number ?? "",
      customerName: s.customer_name ?? "",
      totalAmount: Number(s.total_amount ?? 0),
    })),
    staff: staff.map((member) => ({
      id: member.id,
      name: [member.first_name, member.last_name].filter(Boolean).join(" "),
      email: member.email,
      role: member.position,
    })),
    branches: branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      city: branch.address,
      status: branch.is_active ? "active" : "inactive",
    })),
  };
}
