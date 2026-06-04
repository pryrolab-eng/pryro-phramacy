import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { resolveInsuranceProvider } from "@/lib/insurance/resolve-provider";
import { createServiceClient } from "../../../../../supabase/service";

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

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id);
    const admin = createServiceClient();

    const { data: customer } = await admin
      .from("customers")
      .select("id, name, phone, insurance_number, insurance_provider_id")
      .eq("pharmacy_id", pharmacyId)
      .eq("insurance_number", membership)
      .limit(1)
      .maybeSingle();

    if (customer) {
      let insuranceType: string | undefined;
      let coveragePercent = 90;

      if (customer.insurance_provider_id) {
        const provider = await resolveInsuranceProvider(
          admin,
          pharmacyId,
          customer.insurance_provider_id as string,
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
