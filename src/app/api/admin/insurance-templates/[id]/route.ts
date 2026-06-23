import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import {
  deleteGlobalInsuranceTemplateFromDb,
  updateGlobalInsuranceTemplateFromDb,
} from "@/lib/db/admin";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  try {
    const data = await updateGlobalInsuranceTemplateFromDb(id, {
      name: body.name,
      insuranceProvider: body.insurance_provider,
      templateHtml: body.template_html,
      templateCss: body.template_css ?? "",
      isActive: body.is_active !== false,
    });
    await writeAuditLog({
      pharmacyId: null,
      userId: auth.user.id,
      action: "UPDATE",
      tableName: "insurance_templates",
      recordId: id,
      newValues: {
        id,
        name: body.name,
        insurance_provider: body.insurance_provider,
        is_active: body.is_active !== false,
      },
      ...auditRequestMetadata(request),
    });
    return NextResponse.json({ success: true, template: data });
  } catch (error) {
    console.error("admin insurance-templates PUT:", error);
    const message = error instanceof Error ? error.message : "Failed to update template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const deleted = await deleteGlobalInsuranceTemplateFromDb(id);
    if (!deleted) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    await writeAuditLog({
      pharmacyId: null,
      userId: auth.user.id,
      action: "DELETE",
      tableName: "insurance_templates",
      recordId: id,
      oldValues: { id },
      ...auditRequestMetadata(request),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin insurance-templates DELETE:", error);
    const message = error instanceof Error ? error.message : "Failed to delete template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
