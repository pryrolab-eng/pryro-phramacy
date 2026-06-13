import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import {
  createPlatformApiKeyFromDb,
  listPlatformApiKeysFromDb,
  updatePlatformApiKeyFromDb,
} from "@/lib/db/admin";
import { normalizeIntegrationKeyPermissions } from "@/lib/integrations/v1/constants";

export async function GET() {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await listPlatformApiKeysFromDb();
    return NextResponse.json(data);
  } catch (error) {
    console.error("admin api-keys GET:", error);
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  if (!body?.name || !body?.key) {
    return NextResponse.json({ error: "Name and key are required" }, { status: 400 });
  }

  try {
    const data = await createPlatformApiKeyFromDb({
      name: body.name,
      keyHash: body.key,
      keyPrefix: String(body.key).substring(0, 8),
      createdBy: auth.user.id,
      permissions: normalizeIntegrationKeyPermissions(body.permissions),
    });
    return NextResponse.json({ success: true, apiKey: data });
  } catch (error) {
    console.error("admin api-keys POST:", error);
    const message = error instanceof Error ? error.message : "Failed to create API key";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  if (!body?.id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  try {
    await updatePlatformApiKeyFromDb({
      id: body.id,
      name: body.name,
      keyHash: body.key,
      keyPrefix: String(body.key).substring(0, 8),
      isActive: body.status === "Active",
      ...(body.permissions !== undefined
        ? { permissions: normalizeIntegrationKeyPermissions(body.permissions) }
        : {}),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin api-keys PUT:", error);
    return NextResponse.json({ error: "Failed to update API key" }, { status: 500 });
  }
}
