import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { createServiceClient } from "../../../../../supabase/service";
import {
  clearMustChangePasswordFlag,
  userMustChangePassword,
  validateNewPasswordPair,
} from "@/lib/auth/must-change-password";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const newPassword = String(body.newPassword ?? "");
    const confirmPassword = String(body.confirmPassword ?? "");
    const currentPassword =
      typeof body.currentPassword === "string"
        ? body.currentPassword
        : undefined;

    const validationError = validateNewPasswordPair(newPassword, confirmPassword);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const forced = userMustChangePassword(user);

    if (!forced) {
      if (!currentPassword?.trim()) {
        return NextResponse.json(
          { error: "Current password is required." },
          { status: 400 },
        );
      }
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (verifyError) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 401 },
        );
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword.trim(),
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    const admin = createServiceClient();
    await clearMustChangePasswordFlag(
      admin,
      user.id,
      user.user_metadata as Record<string, unknown> | undefined,
    );

    return NextResponse.json({
      success: true,
      mustChangePassword: false,
    });
  } catch (error) {
    console.error("POST /api/auth/change-password", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 },
    );
  }
}
