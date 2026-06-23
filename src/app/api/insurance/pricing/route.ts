import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { computeInsuranceCoverage } from "@/lib/insurance/coverage-engine";
import {
  mergeProviderCoverage,
  parseMedicationInsuranceCoverage,
} from "@/lib/insurance/medication-coverage";
import { resolveInsuranceProvider } from "@/lib/insurance/resolve-provider";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  storeFindInventorySellingPrice,
  storeFindMedicationByName,
  storeLoadMedicationInsuranceCoverage,
  storeUpdateMedicationInsuranceCoverage,
} from "@/lib/db/insurance-store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const insurance = searchParams.get("insurance");
    const medicationId = searchParams.get("medicationId");
    const product = searchParams.get("product");

    if (!insurance) {
      return NextResponse.json({ price: null });
    }

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ price: null });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);

    let medId = medicationId;
    if (!medId && product) {
      const med = await storeFindMedicationByName(pharmacyId, product.trim());
      medId = med?.id ?? null;
    }

    if (!medId) {
      return NextResponse.json({ price: null, reason: "medication_not_found" });
    }

    const shelf =
      (await storeFindInventorySellingPrice(pharmacyId, medId)) ?? 0;

    const totals = await computeInsuranceCoverage({
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
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const { insurance, priceList } = await request.json();
    if (!insurance || !priceList || typeof priceList !== "object") {
      return NextResponse.json(
        { success: false, error: "insurance and priceList required" },
        { status: 400 },
      );
    }

    const provider = await resolveInsuranceProvider(
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
      const med = await storeFindMedicationByName(
        pharmacyId,
        medicationName.trim(),
      );

      if (!med?.id) {
        errors.push(`Unknown medication: ${medicationName}`);
        continue;
      }

      const coverageMap = await storeLoadMedicationInsuranceCoverage(
        pharmacyId,
        [med.id],
      );
      const coverage = coverageMap.get(med.id) ?? parseMedicationInsuranceCoverage(null);
      const merged = mergeProviderCoverage(coverage, provider.id, {
        covered: true,
      });

      try {
        await storeUpdateMedicationInsuranceCoverage({
          medicationId: med.id,
          pharmacyId,
          coverage: merged,
        });
        updated += 1;
      } catch (err) {
        errors.push(
          `${medicationName}: ${err instanceof Error ? err.message : "update failed"}`,
        );
      }
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
