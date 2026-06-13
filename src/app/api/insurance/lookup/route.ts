import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { resolveInsuranceProvider } from "@/lib/insurance/resolve-provider";
import { storeFindCustomerByInsuranceNumber } from "@/lib/db/insurance-store";

export async function POST(request: NextRequest) {
  try {
    const { insuranceNumber } = await request.json();
    const membership = String(insuranceNumber ?? "").trim();

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Insurance number is required" },
        { status: 400 },
      );
    }

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);

    const customer = await storeFindCustomerByInsuranceNumber(
      pharmacyId,
      membership,
    );

    if (customer) {
      let insuranceType: string | undefined;
      let coveragePercent = 90;

      if (customer.insurance_provider_id) {
        const provider = await resolveInsuranceProvider(
          pharmacyId,
          customer.insurance_provider_id,
        );
        if (provider) {
          insuranceType = provider.name;
          coveragePercent = provider.coveragePercent;
        }
      }

      return NextResponse.json({
        success: true,
        customerId: customer.id,
        customerName: customer.name,
        insuranceType: insuranceType ?? "RSSB",
        coveragePercent,
        status: "active",
        source: "customers",
      });
    }

    const demoMap: Record<string, { type: string; coverage: number }> = {
      INS001: { type: "RSSB", coverage: 80 },
      INS002: { type: "Radiant Insurance", coverage: 70 },
      INS003: { type: "MMI", coverage: 90 },
    };
    const demo = demoMap[membership];
    if (demo) {
      return NextResponse.json({
        success: true,
        insuranceType: demo.type,
        coveragePercent: demo.coverage,
        status: "active",
        source: "demo",
      });
    }

    return NextResponse.json(
      { success: false, error: "Membership not found for this pharmacy" },
      { status: 404 },
    );
  } catch (error) {
    console.error("POST /api/insurance/lookup", error);
    return NextResponse.json({ success: false, error: "Lookup failed" }, { status: 500 });
  }
}
