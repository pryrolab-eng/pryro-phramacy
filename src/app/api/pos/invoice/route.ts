import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { buildInsuranceInvoiceData } from "@/lib/pos/build-insurance-invoice";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, insuranceType, items, doctorName, mrcCode } = body;

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);

    const invoiceData = await buildInsuranceInvoiceData({
      pharmacyId,
      insuranceType: String(insuranceType ?? ""),
      items: Array.isArray(items) ? items : [],
      patientId,
      patientName: body.patientName,
      patientPhone: body.patientPhone,
      relationship: body.relationship,
      affiliateName: body.affiliateName,
      dateOfBirth: body.dateOfBirth,
      dutyStation: body.dutyStation,
      insuranceTIN: body.insuranceTIN,
      doctorName,
      mrcCode,
    });

    return NextResponse.json({ success: true, invoice: invoiceData });
  } catch (error) {
    console.error("POST /api/pos/invoice", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate invoice" },
      { status: 500 },
    );
  }
}
