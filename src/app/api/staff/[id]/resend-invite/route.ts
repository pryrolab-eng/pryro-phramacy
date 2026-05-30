import { NextRequest, NextResponse } from "next/server";
import { sendStaffInviteEmail } from "@/lib/email/staff-invite";
import { createClient } from "../../../../../../supabase/server";
import { createServiceClient } from "../../../../../../supabase/service";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  entitlementErrorResponse,
  requirePharmacyEntitlement,
} from "@/lib/subscription/assert-entitlement";
import { generateTemporaryPassword } from "@/lib/staff/temporary-password";
import { buildStaffInviteApiPayload } from "@/lib/staff/staff-invite-response";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: pharmacyUserId } = await params;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id);
    const admin = createServiceClient();

    await requirePharmacyEntitlement({
      admin,
      pharmacyId,
      feature: "staff.invite",
    });

    const { data: member, error: memberErr } = await admin
      .from("pharmacy_users")
      .select("id, user_id, pharmacy_id, role")
      .eq("id", pharmacyUserId)
      .maybeSingle();

    if (memberErr || !member) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 },
      );
    }

    if (member.pharmacy_id !== pharmacyId) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 },
      );
    }

    const { data: authData, error: authErr } =
      await admin.auth.admin.getUserById(member.user_id);
    if (authErr || !authData.user?.email) {
      return NextResponse.json(
        { success: false, error: "Could not load staff account" },
        { status: 500 },
      );
    }

    const email = authData.user.email.trim().toLowerCase();
    const fullName =
      String(authData.user.user_metadata?.full_name ?? "").trim() ||
      email.split("@")[0]?.replace(/[._]/g, " ") ||
      "Team member";
    const role = String(member.role ?? "pharmacist").trim() || "pharmacist";

    const { data: pharmacy } = await admin
      .from("pharmacies")
      .select("name")
      .eq("id", pharmacyId)
      .maybeSingle();

    const pharmacyName = String(pharmacy?.name ?? "").trim() || "your pharmacy";
    const password = generateTemporaryPassword();

    const { error: passwordError } = await admin.auth.admin.updateUserById(
      member.user_id,
      { password },
    );
    if (passwordError) {
      return NextResponse.json(
        { success: false, error: "Failed to reset password" },
        { status: 500 },
      );
    }

    const emailResult = await sendStaffInviteEmail({
      to: email,
      fullName,
      pharmacyName,
      role,
      temporaryPassword: password,
    });

    return NextResponse.json(
      buildStaffInviteApiPayload({
        email,
        temporaryPassword: password,
        emailResult,
        userId: member.user_id,
        messageWhenEmailOk: "Login instructions were sent by email",
        messageWhenEmailFailed:
          "Password was reset; invitation email could not be sent",
      }),
    );
  } catch (error) {
    const mapped = entitlementErrorResponse(error);
    if (mapped) {
      return NextResponse.json(mapped.body, { status: mapped.status });
    }
    console.error("Resend staff invite error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to resend login instructions",
      },
      { status: 500 },
    );
  }
}
