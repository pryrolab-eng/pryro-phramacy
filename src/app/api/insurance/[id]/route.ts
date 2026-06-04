import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { resolveActivePharmacyContext } from "@/lib/pharmacy/active-pharmacy";

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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const isPlatformAdmin = await resolveIsAppPlatformAdmin(supabase, user.id, null);
    const db = createServiceClient();

    const { data: existing, error: fetchError } = await db
      .from("insurance_providers")
      .select("id, pharmacy_id, name")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw new Error(fetchError.message);
    if (!existing) {
      return NextResponse.json({ success: false, error: "Provider not found" }, { status: 404 });
    }

    if (!isPlatformAdmin) {
      const admin = createServiceClient();
      const ctx = await resolveActivePharmacyContext(admin, user.id);
      if (!["pharmacy_owner", "admin"].includes(ctx.role ?? "")) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
      const pharmacyId = await requireSessionPharmacyId(supabase, user.id);
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

    const { data: updated, error } = await db
      .from("insurance_providers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

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
