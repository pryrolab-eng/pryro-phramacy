import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { assertCanCreatePharmacy } from "@/lib/platform-policy/pharmacy-capacity";
import { platformPolicyErrorResponse } from "@/lib/platform-policy/errors";
import { createOnboardingPharmacy } from "@/lib/onboarding/create-pharmacy";

/**
 * Creates the tenant pharmacy and attaches the current user as pharmacy_owner.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = (body.name as string)?.trim();
    const license_number = (
      (body.license_number as string)?.trim() || `LIC-${Date.now()}`
    ).slice(0, 200);
    const city = (body.city as string)?.trim() || "Kigali";
    const address = (body.address as string)?.trim() || null;
    const phone = (body.phone as string)?.trim();
    const email = (body.email as string)?.trim() || user.email || "";

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Pharmacy name and phone are required." },
        { status: 400 },
      );
    }

    await assertCanCreatePharmacy();

    const result = await createOnboardingPharmacy({
      userId: user.id,
      userEmail: user.email,
      userFullName:
        (user.user_metadata?.full_name as string | undefined) ?? name,
      name,
      licenseNumber: license_number,
      city,
      address,
      phone,
      email,
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const policy = platformPolicyErrorResponse(e);
    if (policy) {
      return NextResponse.json(policy.body, { status: policy.status });
    }
    const message = e instanceof Error ? e.message : "Unexpected error";
    console.error("Onboarding pharmacy error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
