import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";

export async function GET() {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await auth.supabase
    .from("api_keys")
    .select("id, name, key_prefix, is_active, created_at")
    .is("pharmacy_id", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("admin api-keys GET:", error);
    return NextResponse.json({ error: "Failed to fetch API keys" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
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

  const { data, error } = await auth.supabase
    .from("api_keys")
    .insert({
      pharmacy_id: null,
      name: body.name,
      key_hash: body.key,
      key_prefix: String(body.key).substring(0, 8),
      is_active: true,
      created_by: auth.user.id,
    })
    .select("id, name, key_prefix, is_active, created_at")
    .single();

  if (error) {
    console.error("admin api-keys POST:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, apiKey: data });
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

  const { error } = await auth.supabase
    .from("api_keys")
    .update({
      name: body.name,
      key_hash: body.key,
      key_prefix: String(body.key).substring(0, 8),
      is_active: body.status === "Active",
    })
    .eq("id", body.id)
    .is("pharmacy_id", null);

  if (error) {
    console.error("admin api-keys PUT:", error);
    return NextResponse.json({ error: "Failed to update API key" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
