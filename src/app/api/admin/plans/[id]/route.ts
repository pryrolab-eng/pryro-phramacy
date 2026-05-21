import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { syncPlanToPolarAndSave } from "@/lib/polar/sync-plan-db";
import { validatePlanFeatures } from "@/lib/saas/feature-access";

async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) };
  }

  const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null);
  if (!allowed) {
    return {
      error: NextResponse.json(
        { success: false, error: "Forbidden: platform admin access required" },
        { status: 403 }
      ),
    };
  }

  return { db: createServiceClient() };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const auth = await requirePlatformAdmin();
    if ("error" in auth && auth.error) {
      return auth.error;
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          { success: false, error: "Invalid price" },
          { status: 400 }
        );
      }
      updates.price = price;
    }
    if (body.yearly_price !== undefined) {
      updates.yearly_price = body.yearly_price === null ? null : Number(body.yearly_price);
    }    if (body.yearly_discount_pct !== undefined) {
      const pct = Number(body.yearly_discount_pct);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        return NextResponse.json(
          { success: false, error: "yearly_discount_pct must be between 0 and 100" },
          { status: 400 }
        );
      }
      updates.yearly_discount_pct = pct;
    }
    if (body.period !== undefined) updates.period = body.period;
    if (body.billing_period !== undefined) updates.billing_period = body.billing_period;
    if (body.plan_type !== undefined) updates.plan_type = body.plan_type;
    if (body.max_branches !== undefined) updates.max_branches = Number(body.max_branches) || 1;
    if (body.max_users !== undefined) updates.max_users = Number(body.max_users) || 5;
    if (body.monthly_tx_limit !== undefined) updates.monthly_tx_limit = Number(body.monthly_tx_limit) || 500;
    if (body.features !== undefined) {
      const rawFeatures: string[] = Array.isArray(body.features)
        ? body.features.map(String)
        : typeof body.features === 'string'
          ? body.features.split(',').map((f: string) => f.trim()).filter(Boolean)
          : []

      const invalidFeatures = validatePlanFeatures(rawFeatures)
      if (invalidFeatures.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Unknown feature(s): ${invalidFeatures.join(', ')}. Only system-defined features are allowed.`,
          },
          { status: 400 }
        )
      }
      updates.features = rawFeatures
    }
    if (body.is_popular !== undefined) updates.is_popular = body.is_popular;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data: plan, error } = await auth.db
      .from("subscription_plans")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    const synced = await syncPlanToPolarAndSave(auth.db, {
      ...plan,
      features: plan.features ?? updates.features,
    } as Parameters<typeof syncPlanToPolarAndSave>[1]);

    return NextResponse.json({
      success: true,
      plan: synced.plan,
      polarSync: synced.polarSync,
    });
  } catch (error) {
    console.error("PUT /api/admin/plans/[id]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update plan" },
      { status: 500 }
    );
  }
}
