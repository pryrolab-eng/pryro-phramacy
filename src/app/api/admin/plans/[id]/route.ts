import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { syncPlanToPolarAndSave } from "@/lib/polar/sync-plan-db";
import {
  findPlanNameConflict,
  formatPlanNameConflictError,
  isPostgresUniqueViolation,
  normalizePlanType,
} from "@/lib/subscription/plan-name-validation";
import {
  findSubscriptionPlanByIdFromDb,
  listActiveSubscriptionPlansForConflictFromDb,
  updateSubscriptionPlanFromDb,
} from "@/lib/db/admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status },
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          { success: false, error: "Invalid price" },
          { status: 400 },
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
      const currentRow = await findSubscriptionPlanByIdFromDb(id);
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
        { status: 400 },
      );
    }

    const { validateMainPlanLimitAlignment } = await import(
      "@/lib/subscription/plan-limit-alignment"
    );
    const { loadPlanFeatureKeys } = await import("@/lib/subscription/plan-features");

    const featureKeysForCheck = Array.isArray(body.feature_keys)
      ? (body.feature_keys as string[])
      : Array.isArray(body.featureKeys)
        ? (body.featureKeys as string[])
        : null;

    const currentPlan = await findSubscriptionPlanByIdFromDb(id);

    const resolvedFeatureKeys =
      featureKeysForCheck ?? (await loadPlanFeatureKeys(id));

    const merged = {
      max_branches: Number(
        updates.max_branches ??
          (currentPlan as { max_branches?: number })?.max_branches ??
          1,
      ),
      max_users: Number(
        updates.max_users ??
          (currentPlan as { max_users?: number })?.max_users ??
          1,
      ),
      monthly_tx_limit: Number(
        updates.monthly_tx_limit ??
          (currentPlan as { monthly_tx_limit?: number })?.monthly_tx_limit ??
          0,
      ),
      feature_keys: resolvedFeatureKeys,
    };
    const planTypeForCheck = normalizePlanType(
      String(updates.plan_type ?? currentPlan?.plan_type ?? "main"),
    );
    const limitError = validateMainPlanLimitAlignment({
      plan_type: planTypeForCheck,
      ...merged,
    });
    if (limitError) {
      return NextResponse.json({ success: false, error: limitError }, { status: 400 });
    }

    if (updates.name !== undefined) {
      const planName = String(updates.name).trim();
      if (!planName) {
        return NextResponse.json(
          { success: false, error: "Plan name is required" },
          { status: 400 },
        );
      }
      updates.name = planName;

      const existing = await listActiveSubscriptionPlansForConflictFromDb();
      const planType =
        updates.plan_type !== undefined
          ? normalizePlanType(String(updates.plan_type))
          : normalizePlanType(String(currentPlan?.plan_type ?? "main"));

      const conflict = findPlanNameConflict(
        existing,
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

    const plan = await updateSubscriptionPlanFromDb(id, updates);

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
        const { validateRequiredMainPlanKeys } = await import(
          "@/lib/subscription/plan-features"
        );
        const validation = validateRequiredMainPlanKeys(featureKeys);
        if (validation) {
          return NextResponse.json({ success: false, error: validation }, { status: 400 });
        }
      }
      const { syncPlanFeatures, syncPlanMarketingFeatures } = await import(
        "@/lib/subscription/plan-features"
      );
      await syncPlanFeatures(id, featureKeys);
      const labels = await syncPlanMarketingFeatures(id, featureKeys);
      updates.features = labels;
    }

    const synced = await syncPlanToPolarAndSave({
      ...plan,
      features: (updates.features as string[] | undefined) ?? plan.features,
    } as Parameters<typeof syncPlanToPolarAndSave>[0]);

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
      { status: 500 },
    );
  }
}
