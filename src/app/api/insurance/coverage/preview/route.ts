import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { computeInsuranceCoverage } from "@/lib/insurance/coverage-engine";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    const body = await request.json();
    const providerIdOrName = String(
      body.providerId ?? body.insuranceType ?? body.insurance ?? "",
    ).trim();
    const lines = Array.isArray(body.lines) ? body.lines : [];

    if (!providerIdOrName) {
      return NextResponse.json(
        { error: "Insurance provider is required" },
        { status: 400 },
      );
    }

    const totals = await computeInsuranceCoverage({
      pharmacyId,
      providerIdOrName,
      lines: lines.map(
        (line: {
          inventoryId?: string;
          medicationId?: string;
          medicationName?: string;
          quantity?: number;
          shelfUnitPrice?: number;
          price?: number;
        }) => ({
          inventoryId: line.inventoryId,
          medicationId: String(line.medicationId ?? ""),
          medicationName: line.medicationName,
          quantity: Number(line.quantity) || 1,
          shelfUnitPrice: Number(line.shelfUnitPrice ?? line.price) || 0,
        }),
      ),
    });

    if (!totals) {
      return NextResponse.json(
        { error: "Insurance provider not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, ...totals });
  } catch (error) {
    console.error("POST /api/insurance/coverage/preview", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Coverage preview failed",
      },
      { status: 500 },
    );
  }
}
