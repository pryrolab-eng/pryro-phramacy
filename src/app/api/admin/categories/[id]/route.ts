import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import {
  storeDeleteGlobalCategory,
  storeUpdateGlobalCategory,
} from "@/lib/db/admin-store";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const category = await storeUpdateGlobalCategory(id, {
      name: body.name,
      description: body.description,
      isActive: body.status === "Active",
    });
    await writeAuditLog({
      pharmacyId: null,
      userId: auth.user.id,
      action: "UPDATE",
      tableName: "medication_categories",
      recordId: id,
      newValues: category,
      ...auditRequestMetadata(request),
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update category" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const deleted = await storeDeleteGlobalCategory(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 },
      );
    }

    await writeAuditLog({
      pharmacyId: null,
      userId: auth.user.id,
      action: "DELETE",
      tableName: "medication_categories",
      recordId: id,
      oldValues: { id },
      ...auditRequestMetadata(request),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
