import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import {
  createWhitelistEntry,
  deleteWhitelistEntry,
  listWhitelistEntries,
} from "@/lib/db/ip-whitelist";

export async function GET() {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await listWhitelistEntries(null);
    return NextResponse.json({ ips: data });
  } catch (error) {
    console.error("admin ip-whitelist GET:", error);
    return NextResponse.json({ error: "Failed to fetch IP whitelist" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { ip, description } = await request.json();
  if (!ip) {
    return NextResponse.json({ error: "IP address required" }, { status: 400 });
  }

  try {
    const data = await createWhitelistEntry({
      pharmacyId: null,
      ipAddress: ip,
      description: description || "",
    });
    return NextResponse.json({ success: true, ip: data });
  } catch (error) {
    console.error("admin ip-whitelist POST:", error);
    return NextResponse.json({ error: "Failed to add IP" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  try {
    await deleteWhitelistEntry(id, null);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin ip-whitelist DELETE:", error);
    return NextResponse.json({ error: "Failed to delete IP" }, { status: 500 });
  }
}
