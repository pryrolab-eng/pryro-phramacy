import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";

export async function GET() {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await auth.supabase
    .from("insurance_templates")
    .select("*")
    .is("pharmacy_id", null)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("admin insurance-templates GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 },
    );
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json();
  if (!body?.name?.trim() || !body?.insurance_provider?.trim()) {
    return NextResponse.json(
      { error: "Name and insurance provider are required" },
      { status: 400 },
    );
  }

  const { data, error } = await auth.supabase
    .from("insurance_templates")
    .insert({
      pharmacy_id: null,
      name: String(body.name).trim(),
      insurance_provider: String(body.insurance_provider).trim(),
      template_html: body.template_html ?? "",
      template_css: body.template_css ?? "",
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("admin insurance-templates POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, template: data });
}
