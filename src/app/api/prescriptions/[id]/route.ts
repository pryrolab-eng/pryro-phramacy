import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  storeDeletePrescription,
  storePrescriptionInPharmacy,
  storeUpdatePrescription,
} from "@/lib/db/prescriptions-store";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const allowed = await storePrescriptionInPharmacy(id, pharmacyId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 },
      );
    }

    const body = await request.json();

    const prescription = await storeUpdatePrescription(id, pharmacyId, {
      patientName: body.patient,
      doctorName: body.doctor,
      medications: body.medications,
      priority: body.priority,
      status: body.status,
      insuranceProvider: body.insurance,
      notes: body.notes,
    });

    if (!prescription) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, prescription });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update prescription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const deleted = await storeDeletePrescription(id, pharmacyId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Prescription not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete prescription";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
