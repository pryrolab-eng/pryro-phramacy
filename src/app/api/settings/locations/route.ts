import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";

const DEFAULT_LOCATIONS = [
  { id: "1", name: "Main Store", description: "Primary location", is_active: true },
  { id: "2", name: "Branch", description: "Secondary location", is_active: true },
  { id: "3", name: "Cold Storage", description: "Temperature controlled", is_active: true },
  { id: "4", name: "Warehouse", description: "Bulk storage", is_active: true },
];

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
        return NextResponse.json(DEFAULT_LOCATIONS);
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
      return NextResponse.json(DEFAULT_LOCATIONS);
    }
    console.error("Error fetching locations:", error);
    return NextResponse.json(DEFAULT_LOCATIONS);
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
        return NextResponse.json(
          {
            success: false,
            error:
              "Platform admins see default location templates only. Stock locations are managed per pharmacy in pharmacy settings.",
          },
          { status: 400 },
        );
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
