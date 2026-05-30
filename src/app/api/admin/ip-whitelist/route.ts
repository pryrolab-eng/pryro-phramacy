import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";

export async function GET() {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await auth.supabase
    .from("ip_whitelist")
    .select("*")
    .is("pharmacy_id", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("admin ip-whitelist GET:", error);
    return NextResponse.json({ error: "Failed to fetch IP whitelist" }, { status: 500 });
  }

  return NextResponse.json({ ips: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { ip, description } = await request.json();
  if (!ip) {
    return NextResponse.json({ error: "IP address required" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("ip_whitelist")
    .insert({
      pharmacy_id: null,
      ip_address: ip,
      description: description || "",
    })
    .select()
    .single();

  if (error) {
    console.error("admin ip-whitelist POST:", error);
    return NextResponse.json({ error: "Failed to add IP" }, { status: 500 });
  }

  return NextResponse.json({ success: true, ip: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from("ip_whitelist")
    .delete()
    .eq("id", id)
    .is("pharmacy_id", null);

  if (error) {
    console.error("admin ip-whitelist DELETE:", error);
    return NextResponse.json({ error: "Failed to delete IP" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
