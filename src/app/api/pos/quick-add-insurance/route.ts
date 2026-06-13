import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { storeCreateInsuranceProvider } from "@/lib/db/insurance-store";

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

    const newInsurance = await storeCreateInsuranceProvider({
      pharmacyId,
      name: body.insuranceName || "",
      coveragePercentage: parseFloat(body.coveragePercentage) || 0,
    });

    return NextResponse.json({
      success: true,
      insurance: {
        id: newInsurance.id,
        name: newInsurance.name,
        coverage_percentage: Number(
          newInsurance.coverage_percentage ??
            newInsurance.default_coverage_percent ??
            0,
        ),
      },
    });
  } catch (error) {
    console.error("Quick add insurance error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to add insurance",
    });
  }
}
