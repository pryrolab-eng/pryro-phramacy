import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  storeCreateWhitelistEntry,
  storeDeleteWhitelistEntry,
  storeListWhitelistEntries,
} from "@/lib/db/ip-whitelist-store";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const ips = await storeListWhitelistEntries(pharmacyId);

    return NextResponse.json({ ips });
  } catch (error) {
    console.error("IP whitelist fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch IP whitelist" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ip, description } = await request.json();
    if (!ip) {
      return NextResponse.json({ error: "IP address required" }, { status: 400 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const entry = await storeCreateWhitelistEntry({
      pharmacyId,
      ipAddress: ip,
      description: description || "",
    });

    return NextResponse.json({ success: true, ip: entry });
  } catch (error) {
    console.error("IP whitelist add error:", error);
    return NextResponse.json({ error: "Failed to add IP" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "IP ID required" }, { status: 400 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    await storeDeleteWhitelistEntry(id, pharmacyId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("IP whitelist delete error:", error);
    return NextResponse.json({ error: "Failed to delete IP" }, { status: 500 });
  }
}
