import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { uploadAndPersistPharmacyLogo } from "@/lib/pharmacy/upload-pharmacy-logo";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { id: pharmacyId } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const publicUrl = await uploadAndPersistPharmacyLogo(pharmacyId, file);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Admin logo upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload logo" },
      { status: 500 },
    );
  }
}
