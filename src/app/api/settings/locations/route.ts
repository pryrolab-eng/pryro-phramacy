import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/db/audit-logs";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  appendStockLocationTemplate,
  getStockLocationTemplates,
  DEFAULT_STOCK_LOCATION_TEMPLATES,
} from "@/lib/stock-location-templates";

function isMissingStockLocationsTable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: string }).code;
  return code === "P2021" || code === "42P01";
}

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let pharmacyId: string | null = null;
    try {
      pharmacyId = await requireSessionPharmacyId(user.id);
    } catch {
      const isPlatformAdmin = await resolveIsAppPlatformAdmin(user.id);
      if (isPlatformAdmin) {
        return NextResponse.json(await getStockLocationTemplates());
      }
      return NextResponse.json({ success: false, error: "Pharmacy not found" }, { status: 404 });
    }

    const locations = await prisma.stock_locations.findMany({
      where: { pharmacy_id: pharmacyId, is_active: true },
      orderBy: { created_at: "asc" },
    });

    return NextResponse.json(locations);
  } catch (error) {
    if (isMissingStockLocationsTable(error)) {
      return NextResponse.json(DEFAULT_STOCK_LOCATION_TEMPLATES);
    }
    console.error("Error fetching locations:", error);
    return NextResponse.json(DEFAULT_STOCK_LOCATION_TEMPLATES);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let pharmacyId: string;
    try {
      pharmacyId = await requireSessionPharmacyId(user.id);
    } catch {
      const isPlatformAdmin = await resolveIsAppPlatformAdmin(user.id);
      if (isPlatformAdmin) {
        const body = await request.json();
        if (!body.name || typeof body.name !== "string") {
          return NextResponse.json(
            { success: false, error: "Location name is required" },
            { status: 400 },
          );
        }
        const location = await appendStockLocationTemplate({
          name: body.name,
          description:
            typeof body.description === "string" ? body.description : "",
        });
        await writeAuditLog({
          pharmacyId: null,
          userId: user.id,
          action: "INSERT",
          tableName: "system_settings",
          recordId: undefined,
          newValues: { setting_key: "stockLocationTemplates", location },
          ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
          userAgent: request.headers.get("user-agent") ?? undefined,
        });
        return NextResponse.json({ success: true, location });
      }
      return NextResponse.json({ success: false, error: "Pharmacy not found" }, { status: 404 });
    }

    const body = await request.json();

    try {
      const location = await prisma.stock_locations.create({
        data: {
          pharmacy_id: pharmacyId,
          name: body.name,
          description: body.description || "",
          is_active: true,
        },
      });
      await writeAuditLog({
        pharmacyId,
        userId: user.id,
        action: "INSERT",
        tableName: "stock_locations",
        recordId: location.id,
        newValues: location,
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
        userAgent: request.headers.get("user-agent") ?? undefined,
      });
      return NextResponse.json({ success: true, location });
    } catch (error) {
      if (isMissingStockLocationsTable(error)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Stock locations are not set up yet. Run database migrations (stock_locations).",
          },
          { status: 503 },
        );
      }
      throw error;
    }
  } catch (error) {
    if (isMissingStockLocationsTable(error)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Stock locations are not set up yet. Run database migrations (stock_locations).",
        },
        { status: 503 },
      );
    }
    console.error("Error creating location:", error);
    return NextResponse.json({ success: false, error: "Failed to create location" }, { status: 500 });
  }
}
