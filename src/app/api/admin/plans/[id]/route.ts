import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { syncPlanToPolarAndSave } from "@/lib/polar/sync-plan-db";
import {
  findPlanNameConflict,
  formatPlanNameConflictError,
  isPostgresUniqueViolation,
  normalizePlanType,
} from "@/lib/subscription/plan-name-validation";

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
    if (body.billing_cadence !== undefined || body.billing_period !== undefined) {
      updates.billing_period =
        body.billing_cadence === "yearly" || body.billing_period === "yearly"
          ? "yearly"
          : "monthly";
    }
    if (body.features !== undefined) updates.features = body.features;
    if (body.is_popular !== undefined) updates.is_popular = body.is_popular;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.plan_type !== undefined) {
      const pt = String(body.plan_type).trim().toLowerCase();
      updates.plan_type = pt === "branch_addon" ? "branch_addon" : "main";
    }
    if (body.billing_period !== undefined) updates.billing_period = body.billing_period;
    if (body.max_branches !== undefined) {
      updates.max_branches = Number(body.max_branches);
    }
    if (body.max_users !== undefined) {
      updates.max_users = Number(body.max_users);
    }
    if (body.monthly_tx_limit !== undefined) {
      updates.monthly_tx_limit = Number(body.monthly_tx_limit);
    }
    if (updates.price !== undefined || updates.billing_period !== undefined) {
      const { data: currentRow } = await auth.db
        .from("subscription_plans")
        .select("price, billing_period")
        .eq("id", id)
        .maybeSingle();
      const { billingPeriodFromInput, periodLabelFromBilling } = await import(
        "@/lib/subscription/plan-period"
      );
      const price = Number(
        updates.price ?? (currentRow as { price?: number })?.price ?? 0,
      );
      const cadence =
        body.billing_cadence === "yearly" ||
        String(updates.billing_period ?? currentRow?.billing_period ?? "monthly") ===
          "yearly"
          ? "yearly"
          : "monthly";
      const billing_period = billingPeriodFromInput(price, cadence);
      updates.billing_period = billing_period;
      updates.period = periodLabelFromBilling(billing_period);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    if (updates.name !== undefined) {
      const planName = String(updates.name).trim();
      if (!planName) {
        return NextResponse.json(
          { success: false, error: "Plan name is required" },
          { status: 400 }
        );
      }
      updates.name = planName;

      const { data: existing } = await auth.db
        .from("subscription_plans")
        .select("id, name, plan_type, is_active")
        .eq("is_active", true);

      const { data: current } = await auth.db
        .from("subscription_plans")
        .select("plan_type")
        .eq("id", id)
        .single();

      const planType =
        updates.plan_type !== undefined
          ? normalizePlanType(String(updates.plan_type))
          : normalizePlanType(current?.plan_type);

      const conflict = findPlanNameConflict(
        (existing ?? []) as {
          id: string;
          name: string;
          plan_type?: string | null;
          is_active?: boolean | null;
        }[],
        planName,
        planType,
        id,
      );
      if (conflict) {
        return NextResponse.json(
          {
            success: false,
            error: formatPlanNameConflictError(conflict, planName),
          },
          { status: 409 },
        );
      }
    }

    const { data: plan, error } = await auth.db
      .from("subscription_plans")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    const featureKeys = Array.isArray(body.feature_keys)
      ? (body.feature_keys as string[])
      : Array.isArray(body.featureKeys)
        ? (body.featureKeys as string[])
        : null;

    if (featureKeys) {
      const planType = String(
        updates.plan_type ?? (plan as { plan_type?: string }).plan_type ?? "main",
      );
      if (planType === "main") {
        const { validateRequiredMainPlanKeys, syncPlanFeatures, syncPlanMarketingFeatures } =
          await import("@/lib/subscription/plan-features");
        const validation = validateRequiredMainPlanKeys(featureKeys);
        if (validation) {
          return NextResponse.json({ success: false, error: validation }, { status: 400 });
        }
      }
      const { syncPlanFeatures, syncPlanMarketingFeatures } = await import(
        "@/lib/subscription/plan-features"
      );
      await syncPlanFeatures(auth.db, id, featureKeys);
      const labels = await syncPlanMarketingFeatures(auth.db, id, featureKeys);
      updates.features = labels;
    }

    const synced = await syncPlanToPolarAndSave(auth.db, {
      ...plan,
      features: (updates.features as string[] | undefined) ?? plan.features,
    } as Parameters<typeof syncPlanToPolarAndSave>[1]);

    return NextResponse.json({
      success: true,
      plan: {
        ...synced.plan,
        feature_keys: featureKeys ?? undefined,
      },
      polarSync: synced.polarSync,
    });
  } catch (error) {
    if (isPostgresUniqueViolation(error)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A plan with this name already exists. Edit the existing plan or remove duplicates first.",
        },
        { status: 409 },
      );
    }
    console.error("PUT /api/admin/plans/[id]", error);
    return NextResponse.json(
      { success: false, error: "Failed to update plan" },
      { status: 500 }
    );
  }
}
