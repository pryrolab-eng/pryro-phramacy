import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { prisma } from "@/lib/db/prisma";

const SETTING_KEY = "pharmacy_integrations";

const DEFAULT_CONFIG = {
  supplierSync: {
    enabled: false,
    provider: "",
    endpoint: "",
  },
  sms: {
    enabled: false,
    provider: "",
    senderId: "",
  },
};

function normalizeConfig(input: Record<string, unknown>) {
  const supplierSync =
    input.supplierSync && typeof input.supplierSync === "object"
      ? (input.supplierSync as Record<string, unknown>)
      : {};
  const sms =
    input.sms && typeof input.sms === "object"
      ? (input.sms as Record<string, unknown>)
      : {};

  return {
    supplierSync: {
      enabled: supplierSync.enabled === true,
      provider: String(supplierSync.provider ?? "").trim(),
      endpoint: String(supplierSync.endpoint ?? "").trim(),
    },
    sms: {
      enabled: sms.enabled === true,
      provider: String(sms.provider ?? "").trim(),
      senderId: String(sms.senderId ?? "").trim(),
    },
  };
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const pharmacyId = await requireSessionPharmacyId(user.id);

    const [setting, suppliers] = await Promise.all([
      prisma.system_settings.findUnique({
        where: {
          pharmacy_id_setting_key: {
            pharmacy_id: pharmacyId,
            setting_key: SETTING_KEY,
          },
        },
      }),
      prisma.suppliers.count({
        where: { pharmacy_id: pharmacyId, is_active: true },
      }),
    ]);

    return NextResponse.json({
      config:
        setting?.setting_value && typeof setting.setting_value === "object"
          ? { ...DEFAULT_CONFIG, ...(setting.setting_value as object) }
          : DEFAULT_CONFIG,
      status: {
        activeSuppliers: suppliers,
        supplierSyncConnected: false,
        smsConnected: false,
      },
    });
  } catch (error) {
    console.error("GET /api/settings/integrations", error);
    return NextResponse.json(
      { error: "Failed to load integration settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const pharmacyId = await requireSessionPharmacyId(user.id);
    const body = (await request.json()) as Record<string, unknown>;
    const config = normalizeConfig(body);

    const saved = await prisma.system_settings.upsert({
      where: {
        pharmacy_id_setting_key: {
          pharmacy_id: pharmacyId,
          setting_key: SETTING_KEY,
        },
      },
      create: {
        pharmacy_id: pharmacyId,
        setting_key: SETTING_KEY,
        setting_value: config,
      },
      update: {
        setting_value: config,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, config: saved.setting_value });
  } catch (error) {
    console.error("PUT /api/settings/integrations", error);
    return NextResponse.json(
      { error: "Failed to save integration settings" },
      { status: 500 },
    );
  }
}
