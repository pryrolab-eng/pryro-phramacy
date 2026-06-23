import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getAllowUserTwoFactor } from "@/lib/platform-security-policy";
import {
  storeDisableTwoFactor,
  storeGetTwoFactorEnabled,
} from "@/lib/db/public-users-store";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const platformAllows = await getAllowUserTwoFactor();
    const { enabled } = await request.json();

    if (enabled && !platformAllows) {
      return NextResponse.json(
        { error: "Two-factor authentication is disabled by the platform administrator" },
        { status: 403 },
      );
    }

    if (!enabled) {
      await storeDisableTwoFactor(user.id);
      await writeAuditLog({
        pharmacyId: null,
        userId: user.id,
        action: "UPDATE",
        tableName: "auth.users",
        recordId: user.id,
        newValues: { twoFactorEnabled: false },
        ...auditRequestMetadata(request),
      });
      return NextResponse.json({ success: true, enabled: false });
    }

    return NextResponse.json({ error: "Use /setup endpoint to enable 2FA" }, { status: 400 });
  } catch (error) {
    console.error("2FA toggle error:", error);
    return NextResponse.json({ error: "Failed to toggle 2FA" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const platformAllows = await getAllowUserTwoFactor();
    const twoFactorEnabled = await storeGetTwoFactorEnabled(user.id);

    return NextResponse.json({
      enabled: platformAllows ? twoFactorEnabled : false,
      platformAllowsTwoFactor: platformAllows,
    });
  } catch (error) {
    console.error("2FA status error:", error);
    return NextResponse.json({ error: "Failed to get 2FA status" }, { status: 500 });
  }
}
