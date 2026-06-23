import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { mergeProviderCoverage } from "@/lib/insurance/medication-coverage";
import { parseMedicationInsuranceCoverage } from "@/lib/insurance/medication-coverage";
import {
  entitlementRouteResponse,
  guardPosInsuranceForUser,
} from "@/lib/subscription/route-guards";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  storeGetMedicationCoverageDetail,
  storeListMedicationsForProviderCoverage,
  storeUpdateMedicationProviderCoverage,
} from "@/lib/db/insurance-covered-store";
import { findMedicationForCoverageFromDb } from "@/lib/db/insurance";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await guardPosInsuranceForUser(user.id);
    const pharmacyId = await requireUserPharmacyId(user.id);
    const params = new URL(request.url).searchParams;
    const medicationId = params.get("medicationId")?.trim();
    const providerId = params.get("providerId")?.trim();

    if (medicationId) {
      const detail = await storeGetMedicationCoverageDetail(
        pharmacyId,
        medicationId,
      );
      if (!detail) {
        return NextResponse.json(
          { error: "Medication not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(detail);
    }

    if (!providerId) {
      return NextResponse.json(
        { error: "providerId or medicationId query parameter is required" },
        { status: 400 },
      );
    }

    const result = await storeListMedicationsForProviderCoverage(
      pharmacyId,
      providerId,
      params.get("search")?.trim(),
    );

    if (!result) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const guarded = entitlementRouteResponse(error);
    if (guarded) return guarded;
    console.error("GET /api/pharmacy/insurance-covered-medications", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load medications",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await guardPosInsuranceForUser(user.id);
    const pharmacyId = await requireUserPharmacyId(user.id);
    const body = await request.json();

    const medicationId = String(body.medicationId ?? "").trim();
    const providerId = String(body.providerId ?? body.provider ?? "").trim();
    if (!medicationId || !providerId) {
      return NextResponse.json(
        { error: "medicationId and providerId are required" },
        { status: 400 },
      );
    }

    const med = await findMedicationForCoverageFromDb(pharmacyId, medicationId);
    if (!med) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 });
    }

    const listResult = await storeListMedicationsForProviderCoverage(
      pharmacyId,
      providerId,
    );
    if (!listResult) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const covered = Boolean(body.covered);
    const coverage = parseMedicationInsuranceCoverage(med.insurance_coverage);
    const merged = mergeProviderCoverage(coverage, listResult.provider.id, {
      covered,
      externalCode:
        body.externalCode === undefined || body.externalCode === null
          ? undefined
          : String(body.externalCode).trim() || undefined,
      notes:
        body.notes === undefined || body.notes === null
          ? undefined
          : String(body.notes).trim() || undefined,
      effectiveFrom:
        body.effectiveFrom === undefined || body.effectiveFrom === null
          ? undefined
          : String(body.effectiveFrom).trim() || undefined,
      effectiveTo:
        body.effectiveTo === undefined
          ? undefined
          : body.effectiveTo === null
            ? null
            : String(body.effectiveTo).trim() || null,
    });

    await storeUpdateMedicationProviderCoverage({
      pharmacyId,
      medicationId,
      providerId: listResult.provider.id,
      coverage: merged,
    });

    const entry = merged[listResult.provider.id];
    return NextResponse.json({
      success: true,
      medicationId,
      providerId: listResult.provider.id,
      covered: entry?.covered === true,
      externalCode: entry?.externalCode ?? null,
      notes: entry?.notes ?? null,
    });
  } catch (error) {
    const guarded = entitlementRouteResponse(error);
    if (guarded) return guarded;
    console.error("PATCH /api/pharmacy/insurance-covered-medications", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update coverage",
      },
      { status: 500 },
    );
  }
}
