import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";

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
  const { data, error } = await auth.supabase
    .from("insurance_templates")
    .update({
      name: body.name,
      insurance_provider: body.insurance_provider,
      template_html: body.template_html,
      template_css: body.template_css ?? "",
      is_active: body.is_active !== false,
    })
    .eq("id", id)
    .is("pharmacy_id", null)
    .select()
    .single();

  if (error) {
    console.error("admin insurance-templates PUT:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, template: data });
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

  const { error } = await auth.supabase
    .from("insurance_templates")
    .delete()
    .eq("id", id)
    .is("pharmacy_id", null);

  if (error) {
    console.error("admin insurance-templates DELETE:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
