import { NextRequest, NextResponse } from "next/server";
import os from "node:os";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { invalidatePlatformSettingsCache } from "@/lib/platform-settings";
import { writeAuditLog } from "@/lib/db/audit-logs";
import { prisma } from "@/lib/db/prisma";
import {
  storeGetPlatformSystemSettings,
  storeUpsertPlatformSystemSettings,
} from "@/lib/db/admin-store";

const SUPPORTED_PLATFORM_SETTING_KEYS = new Set([
  "platformName",
  "platformLogoUrl",
  "adminEmail",
  "supportEmail",
  "maxPharmacies",
  "enableRegistrations",
  "enableNotifications",
  "scheduledMaintenance",
  "maxUsersPerPharmacy",
  "apiRateLimit",
  "enableWhiteLabel",
  "enableMultiBranch",
  "dataRetentionDays",
  "enableAuditLogs",
  "allowUserTwoFactor",
  "ipWhitelistEnabled",
]);

function filterSupportedPlatformSettings(
  updates: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(updates).filter(([key]) =>
      SUPPORTED_PLATFORM_SETTING_KEYS.has(key),
    ),
  );
}

function getSystemMetrics() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = Math.max(totalMemory - freeMemory, 0);
  const systemLoad = totalMemory > 0 ? Math.round((usedMemory / totalMemory) * 100) : 0;

  return {
    systemLoad: Math.min(100, Math.max(0, systemLoad)),
    totalMemory,
    freeMemory,
    uptime: os.uptime(),
  };
}

async function getIntegrations() {
  const polarConfigured = Boolean(process.env.POLAR_ACCESS_TOKEN?.trim());
  const [
    activeGlobalInsuranceProviders,
    activePharmacyInsuranceProviders,
    activeInsuranceTemplates,
  ] = await Promise.all([
    prisma.global_insurance_providers.count({
      where: { is_active: true },
    }),
    prisma.insurance_providers.count({
      where: { is_active: true },
    }),
    prisma.insurance_templates.count({
      where: { is_active: true },
    }),
  ]);

  const activeInsuranceProviders =
    activeGlobalInsuranceProviders + activePharmacyInsuranceProviders;
  const insuranceConfigured = activeInsuranceProviders > 0;
  const insuranceStatus = !insuranceConfigured
    ? "not_configured"
    : activeInsuranceTemplates > 0
      ? "healthy"
      : "review";

  return {
    paymentGateway: {
      configured: polarConfigured,
      status: polarConfigured ? "healthy" : "not_configured",
      providers: {
        polar: polarConfigured,
      },
    },
    insurance: {
      configured: insuranceConfigured,
      status: insuranceStatus,
      activeProviders: activeInsuranceProviders,
      activeTemplates: activeInsuranceTemplates,
    },
  };
}

export async function GET() {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { settings, analytics } = await storeGetPlatformSystemSettings();
    return NextResponse.json({
      settings,
      analytics,
      systemMetrics: getSystemMetrics(),
      integrations: await getIntegrations(),
    });
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

    const supportedUpdates = filterSupportedPlatformSettings(
      updates as Record<string, unknown>,
    );
    if (Object.keys(supportedUpdates).length === 0) {
      return NextResponse.json(
        { error: "No supported settings provided" },
        { status: 400 },
      );
    }

    await storeUpsertPlatformSystemSettings(supportedUpdates);
    invalidatePlatformSettingsCache();
    await writeAuditLog({
      pharmacyId: null,
      userId: auth.user.id,
      action: "UPDATE",
      tableName: "system_settings",
      newValues: supportedUpdates,
      ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      updated: Object.keys(supportedUpdates).length,
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
