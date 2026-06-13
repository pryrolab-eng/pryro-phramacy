import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { storeCreateCustomer } from "@/lib/db/customers-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const pharmacyId = await requireUserPharmacyId(user.id);

    const newCustomer = await storeCreateCustomer({
      pharmacyId,
      name: body.patientName || body.name || "",
      phone: body.phoneNumber || body.phone || "",
      insuranceNumber: body.insuranceNumber || "",
    });

    return NextResponse.json({
      success: true,
      customer: {
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        insurance_number: newCustomer.insurance_number,
      },
    });
  } catch (error) {
    console.error("Quick add patient error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add patient",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
