import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import {
  createPlatformApiKeyFromDb,
  deletePlatformApiKeyFromDb,
  listPlatformApiKeysFromDb,
  updatePlatformApiKeyFromDb,
} from "@/lib/db/admin";
import { hashApiKeySecret } from "@/lib/auth/api-key-hash";
import { normalizeIntegrationKeyPermissions } from "@/lib/integrations/v1/constants";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";

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
    const permissions = normalizeIntegrationKeyPermissions(body.permissions);
    const key = String(body.key);
    const data = await createPlatformApiKeyFromDb({
      name: body.name,
      keyHash: await hashApiKeySecret(key),
      keyPrefix: key.substring(0, 8),
      createdBy: auth.user.id,
      permissions,
    });
    await writeAuditLog({
      pharmacyId: null,
      userId: auth.user.id,
      action: "INSERT",
      tableName: "api_keys",
      recordId: data.id,
      newValues: {
        name: body.name,
        keyPrefix: key.substring(0, 8),
        permissions,
      },
      ...auditRequestMetadata(request),
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
    const permissions =
      body.permissions !== undefined
        ? normalizeIntegrationKeyPermissions(body.permissions)
        : undefined;
    const key =
      typeof body.key === "string" && body.key.trim() ? body.key : undefined;
    await updatePlatformApiKeyFromDb({
      id: body.id,
      name: body.name,
      ...(key !== undefined
        ? { keyHash: await hashApiKeySecret(key), keyPrefix: key.substring(0, 8) }
        : {}),
      isActive: body.status === "Active",
      ...(permissions !== undefined ? { permissions } : {}),
    });
    await writeAuditLog({
      pharmacyId: null,
      userId: auth.user.id,
      action: "UPDATE",
      tableName: "api_keys",
      recordId: body.id,
      newValues: {
        name: body.name,
        isActive: body.status === "Active",
        keyRotated: Boolean(key),
        permissions,
      },
      ...auditRequestMetadata(request),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin api-keys PUT:", error);
    return NextResponse.json({ error: "Failed to update API key" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  try {
    await deletePlatformApiKeyFromDb(id);
    await writeAuditLog({
      pharmacyId: null,
      userId: auth.user.id,
      action: "DELETE",
      tableName: "api_keys",
      recordId: id,
      ...auditRequestMetadata(request),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin api-keys DELETE:", error);
    return NextResponse.json({ error: "Failed to delete API key" }, { status: 500 });
  }
}
