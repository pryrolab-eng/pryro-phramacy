import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { fixSubscriptionPlanCatalogTypes } from "@/lib/subscription/fix-catalog-types";

/** POST — fix mis-typed plan_type values in the catalog. */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: "Forbidden: platform admin access required" },
        { status: 403 }
      );
    }

    const admin = createServiceClient();
    const result = await fixSubscriptionPlanCatalogTypes(admin);

    return NextResponse.json({
      success: true,
      ...result,
      message:
        result.mainPlansFixed + result.addonsFixed > 0
          ? `Fixed ${result.mainPlansFixed} main plan(s) and ${result.addonsFixed} add-on(s).`
          : "Catalog plan types already look correct.",
    });
  } catch (error) {
    console.error("POST /api/admin/plans/fix-catalog", error);
    return NextResponse.json(
      { success: false, error: "Failed to fix catalog types" },
      { status: 500 }
    );
  }
}
