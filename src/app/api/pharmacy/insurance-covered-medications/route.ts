import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import {
  mergeProviderCoverage,
  parseMedicationInsuranceCoverage,
} from "@/lib/insurance/medication-coverage";
import { resolveInsuranceProvider } from "@/lib/insurance/resolve-provider";
import {
  entitlementRouteResponse,
  guardPosInsurance,
} from "@/lib/subscription/route-guards";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { createServiceClient } from "../../../../../supabase/service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await guardPosInsurance(supabase, user.id);
    const pharmacyId = await requireSessionPharmacyId(supabase, user.id);
    const params = new URL(request.url).searchParams;
    const medicationId = params.get("medicationId")?.trim();
    const providerId = params.get("providerId")?.trim();

    const admin = createServiceClient();

    if (medicationId) {
      const { data: med, error: medError } = await admin
        .from("medications")
        .select("id, name, insurance_coverage")
        .eq("pharmacy_id", pharmacyId)
        .eq("id", medicationId)
        .maybeSingle();

      if (medError) throw new Error(medError.message);
      if (!med) {
        return NextResponse.json(
          { error: "Medication not found" },
          { status: 404 },
        );
      }

      const { data: providerRows, error: providersError } = await admin
        .from("insurance_providers")
        .select("id, name, coverage_percentage, is_active")
        .or(`pharmacy_id.eq.${pharmacyId},pharmacy_id.is.null`)
        .eq("is_active", true)
        .order("name");

      if (providersError) throw new Error(providersError.message);

      const coverage = parseMedicationInsuranceCoverage(med.insurance_coverage);
      const providers = (providerRows ?? []).map((row) => {
        const entry = coverage[row.id];
        return {
          id: row.id,
          name: row.name,
          coveragePercent: Number(row.coverage_percentage ?? 0),
          covered: entry?.covered === true,
          externalCode: entry?.externalCode ?? null,
        };
      });

      return NextResponse.json({
        medication: { id: med.id, name: med.name },
        providers,
      });
    }

    if (!providerId) {
      return NextResponse.json(
        { error: "providerId or medicationId query parameter is required" },
        { status: 400 },
      );
    }

    const provider = await resolveInsuranceProvider(
      admin,
      pharmacyId,
      providerId,
    );
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const search = params.get("search")?.trim();

    let query = admin
      .from("medications")
      .select("id, name, category, insurance_coverage, is_active")
      .eq("pharmacy_id", pharmacyId)
      .eq("is_active", true)
      .order("name");

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query.limit(500);
    if (error) throw new Error(error.message);

    const medications = (data ?? []).map((row) => {
      const coverage = parseMedicationInsuranceCoverage(row.insurance_coverage);
      const entry = coverage[provider.id];
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        covered: entry?.covered === true,
        externalCode: entry?.externalCode ?? null,
        notes: entry?.notes ?? null,
        effectiveFrom: entry?.effectiveFrom ?? null,
        effectiveTo: entry?.effectiveTo ?? null,
      };
    });

    return NextResponse.json({
      provider: {
        id: provider.id,
        name: provider.name,
        coveragePercent: provider.coveragePercent,
      },
      medications,
    });
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await guardPosInsurance(supabase, user.id);
    const pharmacyId = await requireSessionPharmacyId(supabase, user.id);
    const body = await request.json();

    const medicationId = String(body.medicationId ?? "").trim();
    const providerId = String(body.providerId ?? body.provider ?? "").trim();
    if (!medicationId || !providerId) {
      return NextResponse.json(
        { error: "medicationId and providerId are required" },
        { status: 400 },
      );
    }

    const admin = createServiceClient();
    const provider = await resolveInsuranceProvider(
      admin,
      pharmacyId,
      providerId,
    );
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const { data: med, error: medError } = await admin
      .from("medications")
      .select("id, insurance_coverage")
      .eq("pharmacy_id", pharmacyId)
      .eq("id", medicationId)
      .maybeSingle();

    if (medError) throw new Error(medError.message);
    if (!med) {
      return NextResponse.json({ error: "Medication not found" }, { status: 404 });
    }

    const covered = Boolean(body.covered);
    const coverage = parseMedicationInsuranceCoverage(med.insurance_coverage);
    const merged = mergeProviderCoverage(coverage, provider.id, {
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

    const { error: updateError } = await admin
      .from("medications")
      .update({ insurance_coverage: merged })
      .eq("id", medicationId)
      .eq("pharmacy_id", pharmacyId);

    if (updateError) throw new Error(updateError.message);

    const entry = merged[provider.id];
    return NextResponse.json({
      success: true,
      medicationId,
      providerId: provider.id,
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
