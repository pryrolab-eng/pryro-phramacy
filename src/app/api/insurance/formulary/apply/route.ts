import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import {
  mergeProviderCoverage,
  parseMedicationInsuranceCoverage,
} from "@/lib/insurance/medication-coverage";
import { resolveInsuranceProvider } from "@/lib/insurance/resolve-provider";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  storeLoadMedicationInsuranceCoverage,
  storeUpdateMedicationInsuranceCoverage,
} from "@/lib/db/insurance-store";
import { prisma } from "@/lib/db/prisma";
import { MAX_IMPORT_ROWS } from "@/lib/import/types";

type ApplyBody = {
  insurance?: string;
  items?: Array<{
    medicationId: string;
    externalCode?: string;
  }>;
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const body = (await request.json()) as ApplyBody;
    const insurance = String(body.insurance ?? "").trim();
    const items = body.items ?? [];

    if (!insurance) {
      return NextResponse.json(
        { success: false, error: "insurance is required" },
        { status: 400 },
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No confirmed items to apply" },
        { status: 400 },
      );
    }

    if (items.length > MAX_IMPORT_ROWS) {
      return NextResponse.json(
        {
          success: false,
          error: `Import limited to ${MAX_IMPORT_ROWS} rows per batch`,
        },
        { status: 400 },
      );
    }

    const provider = await resolveInsuranceProvider(pharmacyId, insurance);
    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Provider not found" },
        { status: 404 },
      );
    }

    const failures: Array<{ medicationId: string; error: string }> = [];
    let applied = 0;

    for (const item of items) {
      const medicationId = String(item.medicationId ?? "").trim();
      if (!medicationId) continue;

      const med = await prisma.medications.findFirst({
        where: { id: medicationId, pharmacy_id: pharmacyId },
        select: { id: true, name: true },
      });

      if (!med) {
        failures.push({
          medicationId,
          error: "Medication not found in your catalog",
        });
        continue;
      }

      const coverageMap = await storeLoadMedicationInsuranceCoverage(
        pharmacyId,
        [med.id],
      );
      const coverage =
        coverageMap.get(med.id) ?? parseMedicationInsuranceCoverage(null);
      const merged = mergeProviderCoverage(coverage, provider.id, {
        covered: true,
        ...(item.externalCode?.trim()
          ? { externalCode: item.externalCode.trim() }
          : {}),
      });

      try {
        await storeUpdateMedicationInsuranceCoverage({
          medicationId: med.id,
          pharmacyId,
          coverage: merged,
        });
        applied += 1;
      } catch (err) {
        failures.push({
          medicationId,
          error: err instanceof Error ? err.message : "Update failed",
        });
      }
    }

    return NextResponse.json({
      success: failures.length === 0,
      applied,
      failures,
    });
  } catch (error) {
    console.error("POST /api/insurance/formulary/apply", error);
    return NextResponse.json(
      { success: false, error: "Failed to apply formulary coverage" },
      { status: 500 },
    );
  }
}
