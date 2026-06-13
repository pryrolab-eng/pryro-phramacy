import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { resolveActivePharmacyContext } from "@/lib/pharmacy/active-pharmacy";
import {
  storeFindInsuranceProviderById,
  storeUpdateInsuranceProvider,
} from "@/lib/db/insurance-store";

function clampCoveragePercent(value: unknown): number | null {
  const n = parseFloat(String(value));
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, n));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }

    const body = await request.json();
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const isPlatformAdmin = await resolveIsAppPlatformAdmin(user.id);

    const existing = await storeFindInsuranceProviderById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Provider not found" }, { status: 404 });
    }

    if (!isPlatformAdmin) {
      const ctx = await resolveActivePharmacyContext(user.id);
      if (!["pharmacy_owner", "admin"].includes(ctx.role ?? "")) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
      const pharmacyId = await requireUserPharmacyId(user.id);
      if (existing.pharmacy_id !== pharmacyId) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json({ success: false, error: "Name cannot be empty" }, { status: 400 });
      }
      updates.name = name;
    }

    const pct =
      body.default_coverage_percent !== undefined
        ? clampCoveragePercent(body.default_coverage_percent)
        : body.coverage_percentage !== undefined
          ? clampCoveragePercent(body.coverage_percentage)
          : null;

    if (pct !== null) {
      updates.coverage_percentage = pct;
      updates.default_coverage_percent = pct;
    } else if (
      body.default_coverage_percent !== undefined ||
      body.coverage_percentage !== undefined
    ) {
      return NextResponse.json(
        { success: false, error: "Coverage percent must be between 0 and 100" },
        { status: 400 },
      );
    }

    if (body.contact_email !== undefined) {
      updates.contact_email = body.contact_email
        ? String(body.contact_email).trim()
        : null;
    }
    if (body.contact_phone !== undefined) {
      updates.contact_phone = body.contact_phone
        ? String(body.contact_phone).trim()
        : null;
    }
    if (body.policy_number !== undefined) {
      updates.policy_number = body.policy_number
        ? String(body.policy_number).trim()
        : null;
    }
    if (body.is_active !== undefined) {
      updates.is_active = Boolean(body.is_active);
    }

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    const updated = await storeUpdateInsuranceProvider(id, updates);

    return NextResponse.json({
      success: true,
      insurance: updated,
      message: "Insurance provider updated",
    });
  } catch (error) {
    console.error("PATCH /api/insurance/[id]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Update failed",
      },
      { status: 500 },
    );
  }
}
