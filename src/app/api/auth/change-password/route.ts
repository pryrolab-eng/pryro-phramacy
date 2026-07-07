import { NextRequest, NextResponse } from "next/server";

import { getAuthUser } from "@/lib/auth/get-auth-user";


import {

  clearMustChangePasswordFlag,

  userMustChangePassword,

  validateNewPasswordPair,

} from "@/lib/auth/must-change-password";

import { assertActivePharmacyDashboardAccess } from "@/lib/subscription/assert-pharmacy-access";

import { adminUpdateAuthUserPassword } from "@/lib/auth/admin-users";

import { findAuthUserByIdFromDb } from "@/lib/db/auth-credentials";

import { invalidateNativeAuthUserCache } from "@/lib/auth/native/session-cache";



export async function POST(request: NextRequest) {

  try {

    const user = await getAuthUser(request, {
      strictNativeSession: true,
    });



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



    const forced = userMustChangePassword({

      user_metadata: user.user_metadata ?? {},

    });

    if (!forced) {

      try {

        await assertActivePharmacyDashboardAccess(user.id);

      } catch {

        return NextResponse.json(

          {

            error:

              "Your pharmacy access is paused. You cannot change your password until access is restored.",

            code: "access_blocked",

          },

          { status: 403 },

        );

      }



      if (!currentPassword?.trim()) {

        return NextResponse.json(

          { error: "Current password is required." },

          { status: 400 },

        );

      }



      const cred = await findAuthUserByIdFromDb(user.id);

      const ok = await verifyPassword(

        currentPassword,

        cred?.encrypted_password,

      );

      if (!ok) {

        return NextResponse.json(

          { error: "Current password is incorrect." },

          { status: 401 },

        );

      }

    }



    await adminUpdateAuthUserPassword(user.id, newPassword.trim());

    await clearMustChangePasswordFlag(user.id, user.user_metadata);
    invalidateNativeAuthUserCache(user.id);
    await writeAuditLog({
      pharmacyId: null,
      userId: user.id,
      action: "UPDATE",
      tableName: "auth.users",
      recordId: user.id,
      newValues: {
        securityEvent: forced ? "forced_password_changed" : "password_changed",
      },
      ...auditRequestMetadata(request),
    });



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

