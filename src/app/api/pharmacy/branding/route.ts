import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  entitlementErrorResponse,
  requirePharmacyEntitlement,
} from "@/lib/subscription/assert-entitlement";
import {
  loadPharmacyBrandingRow,
  savePharmacyBrandingRow,
} from "@/lib/pharmacy/branding-db";
import { DEFAULT_PHARMACY_BRANDING } from "@/lib/pharmacy/default-branding";
import { resolvePharmacyEntitlements } from "@/lib/subscription/lifecycle/entitlements";
import { assertPlatformWhiteLabelEnabled } from "@/lib/platform-policy/enforce";
import { platformPolicyErrorResponse } from "@/lib/platform-policy/errors";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireUserPharmacyId(user.id);

    try {
      const entitlements = await resolvePharmacyEntitlements(pharmacyId);
      if (!entitlements.can("customization")) {
        return NextResponse.json(DEFAULT_PHARMACY_BRANDING);
      }
    } catch (entErr) {
      console.error("GET branding: entitlements check failed", entErr);
      return NextResponse.json(DEFAULT_PHARMACY_BRANDING);
    }

    const branding = await loadPharmacyBrandingRow(pharmacyId);
    if (!branding) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });
    }

    return NextResponse.json(branding);
  } catch (error) {
    console.error("Branding fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch branding" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    await savePharmacyBrandingRow(pharmacyId, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    const policy = platformPolicyErrorResponse(error);
    if (policy) {
      return NextResponse.json(policy.body, { status: policy.status });
    }
    const ent = entitlementErrorResponse(error);
    if (ent) {
      return NextResponse.json(ent.body, { status: ent.status });
    }
    console.error("Branding update error:", error);
    return NextResponse.json({ error: "Failed to update branding" }, { status: 500 });
  }
}
