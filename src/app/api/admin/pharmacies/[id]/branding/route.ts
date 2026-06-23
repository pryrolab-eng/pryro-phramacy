import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import {
  loadPharmacyBrandingRow,
  savePharmacyBrandingRow,
} from "@/lib/pharmacy/branding-db";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  try {
    const branding = await loadPharmacyBrandingRow(id);
    if (!branding) {
      return NextResponse.json({ error: "Pharmacy not found" }, { status: 404 });
    }
    return NextResponse.json(branding);
  } catch (e) {
    console.error("GET admin pharmacy branding", e);
    return NextResponse.json({ error: "Failed to load branding" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    await savePharmacyBrandingRow(id, body);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PUT admin pharmacy branding", e);
    return NextResponse.json({ error: "Failed to update branding" }, { status: 500 });
  }
}
