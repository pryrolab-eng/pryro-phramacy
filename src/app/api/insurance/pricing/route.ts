import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { computeInsuranceCoverage } from "@/lib/insurance/coverage-engine";
import {
  mergeProviderCoverage,
  parseMedicationInsuranceCoverage,
} from "@/lib/insurance/medication-coverage";
import { resolveInsuranceProvider } from "@/lib/insurance/resolve-provider";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { createServiceClient } from "../../../../../supabase/service";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const insurance = searchParams.get("insurance");
    const medicationId = searchParams.get("medicationId");
    const product = searchParams.get("product");

    if (!insurance) {
      return NextResponse.json({ price: null });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ price: null });
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id);
    const admin = createServiceClient();

    let medId = medicationId;
    if (!medId && product) {
      const { data: med } = await admin
        .from("medications")
        .select("id, name")
        .eq("pharmacy_id", pharmacyId)
        .ilike("name", product.trim())
        .limit(1)
        .maybeSingle();
      medId = med?.id ?? null;
    }

    if (!medId) {
      return NextResponse.json({ price: null, reason: "medication_not_found" });
    }

    const { data: inv } = await admin
      .from("inventory")
      .select("selling_price")
      .eq("pharmacy_id", pharmacyId)
      .eq("medication_id", medId)
      .gt("quantity_in_stock", 0)
      .limit(1)
      .maybeSingle();

    const shelf = Number(inv?.selling_price) || 0;

    const totals = await computeInsuranceCoverage(admin, {
      pharmacyId,
      providerIdOrName: insurance,
      lines: [
        {
          medicationId: medId,
          quantity: 1,
          shelfUnitPrice: shelf,
        },
      ],
    });

    const line = totals?.lines[0];
    return NextResponse.json({
      price: line?.isCovered ? shelf : null,
      isCovered: line?.isCovered ?? false,
      coveragePercent: line?.coveragePercent ?? null,
      reason: line?.reason ?? null,
    });
  } catch (error) {
    console.error("GET /api/insurance/pricing", error);
    return NextResponse.json({ price: null });
  }
}

/** Mark medications as covered for an insurer by product name (legacy bulk helper). */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id);
    const { insurance, priceList } = await request.json();
    if (!insurance || !priceList || typeof priceList !== "object") {
      return NextResponse.json(
        { success: false, error: "insurance and priceList required" },
        { status: 400 },
      );
    }

    const admin = createServiceClient();
    const provider = await resolveInsuranceProvider(
      admin,
      pharmacyId,
      String(insurance),
    );
    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Provider not found" },
        { status: 404 },
      );
    }

    let updated = 0;
    const errors: string[] = [];

    for (const medicationName of Object.keys(priceList as Record<string, unknown>)) {
      const { data: med } = await admin
        .from("medications")
        .select("id, insurance_coverage")
        .eq("pharmacy_id", pharmacyId)
        .ilike("name", medicationName.trim())
        .limit(1)
        .maybeSingle();

      if (!med?.id) {
        errors.push(`Unknown medication: ${medicationName}`);
        continue;
      }

      const coverage = parseMedicationInsuranceCoverage(med.insurance_coverage);
      const merged = mergeProviderCoverage(coverage, provider.id, {
        covered: true,
      });

      const { error } = await admin
        .from("medications")
        .update({ insurance_coverage: merged })
        .eq("id", med.id)
        .eq("pharmacy_id", pharmacyId);

      if (error) {
        errors.push(`${medicationName}: ${error.message}`);
        continue;
      }
      updated += 1;
    }

    return NextResponse.json({
      success: errors.length === 0,
      upserted: updated,
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error("POST /api/insurance/pricing", error);
    return NextResponse.json(
      { success: false, error: "Coverage update failed" },
      { status: 500 },
    );
  }
}
