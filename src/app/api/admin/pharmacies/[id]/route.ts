import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { buildAdminPharmacyDetail } from "@/lib/admin/pharmacy-detail";
import { preparePharmacyForAdminDelete } from "@/lib/admin/pharmacy-delete";
import { resolveSubscriptionPlanEnum } from "@/lib/admin/resolve-subscription-plan-enum";
import {
  adminUpdateAuthUserEmail,
  adminUpdateAuthUserPassword,
} from "@/lib/auth/admin-users";
import {
  deletePharmacyFromDb,
  findPharmacyByIdFromDb,
  listActiveMainCatalogPlansFromDb,
  updatePharmacyFromDb,
  upsertOwnerPublicUserFromDb,
} from "@/lib/db/admin";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const catalogRows = await listActiveMainCatalogPlansFromDb();
    const detail = await buildAdminPharmacyDetail(id, catalogRows);

    if (!detail) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, detail });
  } catch (e) {
    console.error("GET /api/admin/pharmacies/[id]", e);
    return NextResponse.json(
      { error: "Failed to load pharmacy detail" },
      { status: 500 },
    );
  }
}

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
    const subscriptionPlan = await resolveSubscriptionPlanEnum(
      body.subscription_plan as string | undefined,
    );

    const currentPharmacy = await findPharmacyByIdFromDb(id);
    if (!currentPharmacy) {
      return NextResponse.json(
        { success: false, error: "Pharmacy not found" },
        { status: 404 },
      );
    }

    const nextStatus =
      body.status === "suspended" || body.status === "inactive"
        ? body.status
        : "active";

    const pharmacy = await updatePharmacyFromDb(id, {
      name: body.name,
      address: body.address,
      phone: body.phone,
      email: body.email,
      licenseNumber: body.license_number,
      subscriptionPlan,
      status: nextStatus,
    });

    const ownerId = currentPharmacy.owner_id as string | undefined;
    if (body.new_password && ownerId) {
      try {
        await adminUpdateAuthUserPassword(ownerId, body.new_password);
      } catch (passwordError) {
        console.error("Password update failed:", passwordError);
      }
    }

    const ownerEmail = body.owner_email || body.email;
    if (ownerEmail && ownerEmail !== currentPharmacy.email && ownerId) {
      try {
        await adminUpdateAuthUserEmail(ownerId, ownerEmail);
      } catch (emailError) {
        console.error("Email update failed:", emailError);
      }
    }

    if (ownerId) {
      try {
        await upsertOwnerPublicUserFromDb({
          userId: ownerId,
          email: ownerEmail ?? String(currentPharmacy.email ?? ""),
          name: body.owner_name ?? "",
        });
      } catch (profileError) {
        console.log("Profile update skipped:", profileError);
      }
    }

    return NextResponse.json({ success: true, pharmacy });
  } catch (error) {
    console.error("Error updating pharmacy:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update pharmacy" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    const prep = await preparePharmacyForAdminDelete(id);

    if (!prep.ok) {
      if (prep.reason === "active_subscriptions") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cannot delete this pharmacy while it has an active subscription. Cancel or expire the plan first.",
          },
          { status: 400 },
        );
      }
      console.error("DELETE pharmacy subscription check:", prep.message);
      return NextResponse.json(
        {
          success: false,
          error: "Could not verify subscriptions before delete. Try again.",
        },
        { status: 500 },
      );
    }

    try {
      await deletePharmacyFromDb(id);
    } catch (error) {
      console.error("DELETE pharmacy:", error);
      const message = error instanceof Error ? error.message : "Failed to delete pharmacy";
      const isFk =
        message.includes("23503") ||
        message.toLowerCase().includes("foreign key");
      return NextResponse.json(
        {
          success: false,
          error: isFk
            ? "Cannot delete this pharmacy because related records still exist."
            : "Failed to delete pharmacy",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      cancelledSubscriptions: prep.cancelledSubscriptionIds.length,
    });
  } catch (error) {
    console.error("Error deleting pharmacy:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete pharmacy" },
      { status: 500 },
    );
  }
}
