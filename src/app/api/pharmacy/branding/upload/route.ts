import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  entitlementErrorResponse,
  requirePharmacyEntitlement,
} from "@/lib/subscription/assert-entitlement";
import { uploadAndPersistPharmacyLogo } from "@/lib/pharmacy/upload-pharmacy-logo";
import { assertPlatformWhiteLabelEnabled } from "@/lib/platform-policy/enforce";
import { platformPolicyErrorResponse } from "@/lib/platform-policy/errors";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);
    await assertPlatformWhiteLabelEnabled();

    await requirePharmacyEntitlement({
      pharmacyId,
      feature: "customization",
    });

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const publicUrl = await uploadAndPersistPharmacyLogo(pharmacyId, file);

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error) {
    const policy = platformPolicyErrorResponse(error);
    if (policy) {
      return NextResponse.json(policy.body, { status: policy.status });
    }
    const ent = entitlementErrorResponse(error);
    if (ent) {
      return NextResponse.json(ent.body, { status: ent.status });
    }
    console.error("Logo upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload logo" },
      { status: 500 },
    );
  }
}
