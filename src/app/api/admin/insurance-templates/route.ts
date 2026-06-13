import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import {
  createGlobalInsuranceTemplateFromDb,
  listGlobalInsuranceTemplatesFromDb,
} from "@/lib/db/admin";

export async function GET() {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await listGlobalInsuranceTemplatesFromDb();
    return NextResponse.json(data);
  } catch (error) {
    console.error("admin insurance-templates GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 },
    );
  }
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

  try {
    const data = await createGlobalInsuranceTemplateFromDb({
      name: String(body.name).trim(),
      insuranceProvider: String(body.insurance_provider).trim(),
      templateHtml: body.template_html ?? "",
      templateCss: body.template_css ?? "",
    });
    return NextResponse.json({ success: true, template: data });
  } catch (error) {
    console.error("admin insurance-templates POST:", error);
    const message = error instanceof Error ? error.message : "Failed to create template";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
