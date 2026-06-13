import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";

async function assertPrescriptionInPharmacy(
  prescriptionId: string,
  pharmacyId: string,
): Promise<boolean> {
  const row = await prisma.prescriptions.findFirst({
    where: { id: prescriptionId, pharmacy_id: pharmacyId },
    select: { id: true },
  });
  return Boolean(row);
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);

    const prescriptions = await prisma.prescriptions.findMany({
      where: { pharmacy_id: pharmacyId, status: "pending" },
      orderBy: [{ priority: "desc" }, { created_at: "asc" }],
    });

    const formattedPrescriptions = prescriptions.map((p) => ({
      id: p.id,
      patient: p.patient_name,
      doctor: p.doctor_name,
      medications: p.medications,
      priority: p.priority,
      time: p.created_at ? new Date(p.created_at).toLocaleTimeString() : "",
      insurance: p.insurance_provider || "None",
    }));

    return NextResponse.json(formattedPrescriptions);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch prescriptions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const { prescriptionId, action } = await request.json();

    if (!prescriptionId || !action) {
      return NextResponse.json(
        { error: "prescriptionId and action are required" },
        { status: 400 },
      );
    }

    const allowed = await assertPrescriptionInPharmacy(prescriptionId, pharmacyId);
    if (!allowed) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    if (action === "start") {
      return NextResponse.json({ success: true });
    }

    if (action === "dispense") {
      await prisma.prescriptions.update({
        where: { id: prescriptionId },
        data: { status: "dispensed" },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process prescription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
