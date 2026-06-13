import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import {
  deleteGlobalInsuranceTemplateFromDb,
  updateGlobalInsuranceTemplateFromDb,
} from "@/lib/db/admin";

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
    return NextResponse.json({ success: true, template: data });
  } catch (error) {
    console.error("admin insurance-templates PUT:", error);
    const message = error instanceof Error ? error.message : "Failed to update template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
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
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("admin insurance-templates DELETE:", error);
    const message = error instanceof Error ? error.message : "Failed to delete template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
