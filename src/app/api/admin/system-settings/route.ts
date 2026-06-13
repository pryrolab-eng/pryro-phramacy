import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { invalidatePlatformSettingsCache } from "@/lib/platform-settings";
import {
  storeGetPlatformSystemSettings,
  storeUpsertPlatformSystemSettings,
} from "@/lib/db/admin-store";

export async function GET() {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { settings, analytics } = await storeGetPlatformSystemSettings();
    return NextResponse.json({ settings, analytics });
  } catch (error: unknown) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const updates = await request.json();
    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    await storeUpsertPlatformSystemSettings(
      updates as Record<string, unknown>,
    );
    invalidatePlatformSettingsCache();

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      updated: Object.keys(updates).length,
    });
  } catch (error: unknown) {
    console.error("Failed to update settings:", error);
    return NextResponse.json(
      {
        error: "Failed to update settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
