import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { buildAdminPharmaciesList } from "@/lib/admin/pharmacies-admin-list";
import { resolveSubscriptionPlanEnum } from "@/lib/admin/resolve-subscription-plan-enum";
import {
  adminCreateAuthUser,
  adminDeleteAuthUser,
} from "@/lib/auth/admin-users";
import { assertCanCreatePharmacy } from "@/lib/platform-policy/pharmacy-capacity";
import { platformPolicyErrorResponse } from "@/lib/platform-policy/errors";
import {
  storeCreatePharmacy,
  storeCreatePharmacyOwnerMembership,
  storeUpsertOwnerPublicUser,
} from "@/lib/db/admin-store";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";
import {
  emitPlatformAdminNotification,
  PLATFORM_ADMIN_EVENT,
} from "@/lib/notifications/platform-admin";

export async function GET() {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const enriched = await buildAdminPharmaciesList();
    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching pharmacies:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status },
      );
    }

    const body = await request.json();

    const ownerEmail = (body.owner_email as string)?.trim();
    const ownerPassword = body.owner_password as string;
    const ownerName = (body.owner_name as string)?.trim() || "";

    if (!ownerEmail || !ownerPassword) {
      return NextResponse.json(
        { success: false, error: "Owner email and password are required." },
        { status: 400 },
      );
    }

    if (ownerPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Owner password must be at least 6 characters." },
        { status: 400 },
      );
    }

    await assertCanCreatePharmacy();

    let authUser: { user: { id: string; email: string } };
    try {
      authUser = await adminCreateAuthUser({
        email: ownerEmail,
        password: ownerPassword,
        fullName: ownerName,
        userMetadata: { full_name: ownerName },
      });
    } catch (authError) {
      console.error("Auth error:", authError);
      return NextResponse.json(
        {
          success: false,
          error: `User creation failed: ${
            authError instanceof Error ? authError.message : "Unknown error"
          }`,
        },
        { status: 400 },
      );
    }

    const pharmacyEmail = (body.email as string)?.trim() || ownerEmail;
    const subscriptionPlan = await resolveSubscriptionPlanEnum(
      body.subscription_plan as string,
    );

    let pharmacy;
    try {
      pharmacy = await storeCreatePharmacy({
        name: body.name,
        address: body.address ?? null,
        phone: body.phone ?? null,
        email: pharmacyEmail,
        licenseNumber: body.license_number || `LIC-${Date.now()}`,
        subscriptionPlan,
        ownerId: authUser.user.id,
        status: "active",
      });
    } catch (pharmacyError) {
      console.error("Pharmacy creation error:", pharmacyError);
      await adminDeleteAuthUser(authUser.user.id);
      return NextResponse.json(
        {
          success: false,
          error: `Pharmacy creation failed: ${
            pharmacyError instanceof Error
              ? pharmacyError.message
              : "Unknown error"
          }`,
        },
        { status: 400 },
      );
    }

    try {
      await storeUpsertOwnerPublicUser({
        userId: authUser.user.id,
        email: ownerEmail,
        name: ownerName,
      });
      await storeCreatePharmacyOwnerMembership({
        userId: authUser.user.id,
        pharmacyId: pharmacy.id as string,
      });
    } catch (memberError) {
      console.error("pharmacy_users insert error:", memberError);
      const { storeDeletePharmacy } = await import("@/lib/db/admin-store");
      await storeDeletePharmacy(pharmacy.id as string);
      await adminDeleteAuthUser(authUser.user.id);
      return NextResponse.json(
        {
          success: false,
          error: `Could not link owner to pharmacy: ${
            memberError instanceof Error ? memberError.message : "Unknown error"
          }`,
        },
        { status: 400 },
      );
    }

    await writeAuditLog({
      pharmacyId: null,
      userId: auth.user.id,
      action: "INSERT",
      tableName: "pharmacies",
      recordId: pharmacy.id as string,
      newValues: {
        pharmacyId: pharmacy.id,
        name: pharmacy.name,
        email: pharmacy.email,
        subscriptionPlan,
        ownerUserId: authUser.user.id,
        ownerEmail,
      },
      ...auditRequestMetadata(request),
    });

    void emitPlatformAdminNotification({
      eventType: PLATFORM_ADMIN_EVENT.pharmacyRegistered,
      title: "New pharmacy registered",
      message: `${pharmacy.name as string} was created by an admin.`,
      type: "success",
      actionUrl: `/admin/tenants`,
      payload: {
        pharmacyId: pharmacy.id,
        pharmacyName: pharmacy.name,
        createdByAdmin: true,
      },
    });

    return NextResponse.json({
      success: true,
      pharmacy,
      owner: {
        email: ownerEmail,
        message:
          "Share the owner email and password with the pharmacy owner for sign-in.",
      },
    });
  } catch (error) {
    const policy = platformPolicyErrorResponse(error);
    if (policy) {
      return NextResponse.json(
        { success: false, ...policy.body },
        { status: policy.status },
      );
    }
    console.error("Error creating pharmacy:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create pharmacy";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
