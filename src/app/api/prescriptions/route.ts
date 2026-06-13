import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  storeCreatePrescription,
  storeListPrescriptions,
  type PrescriptionRow,
} from "@/lib/db/prescriptions-store";

function formatPrescription(p: PrescriptionRow) {
  return {
    id: p.id,
    patient: p.patient_name,
    doctor: p.doctor_name,
    medications: p.medications,
    priority: p.priority ?? "medium",
    status: p.status ?? "pending",
    time: p.created_at
      ? new Date(p.created_at).toLocaleTimeString()
      : "",
    insurance: p.insurance_provider || "None",
    created_at: p.created_at?.toISOString() ?? null,
  };
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const prescriptions = await storeListPrescriptions(pharmacyId);

    return NextResponse.json(prescriptions.map(formatPrescription));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch prescriptions";
    const status = message === "Pharmacy not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const body = await request.json();

    const prescription = await storeCreatePrescription({
      pharmacyId,
      patientName: body.patient,
      doctorName: body.doctor,
      medications: body.medications,
      priority: body.priority,
      insuranceProvider: body.insurance || "None",
      notes: body.notes,
    });

    return NextResponse.json({ success: true, prescription });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create prescription";
    const status = message === "Pharmacy not found" ? 404 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
