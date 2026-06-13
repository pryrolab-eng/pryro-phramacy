import { NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { fixSubscriptionPlanCatalogTypes } from "@/lib/subscription/fix-catalog-types";

/** POST — fix mis-typed plan_type values in the catalog. */
export async function POST() {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status },
      );
    }

    const result = await fixSubscriptionPlanCatalogTypes();

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
      { status: 500 },
    );
  }
}
