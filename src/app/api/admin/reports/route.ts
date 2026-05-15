import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "../../../../../supabase/server";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";

const MAX_BYTES = 25 * 1024 * 1024;
const BUCKET = "platform-reports";

function sanitizeFileName(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").replace(/[^\w.\-()+ ]/g, "_");
  return base.slice(0, 180) || "report.bin";
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null);
    if (!allowed) {
      return NextResponse.json(
        { error: "Forbidden: platform admin access required" },
        { status: 403 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file field" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large (max ${MAX_BYTES / (1024 * 1024)} MB)` },
        { status: 400 },
      );
    }

    const nameRaw = formData.get("name");
    const name = String(
      nameRaw && String(nameRaw).trim() ? nameRaw : file.name,
    ).slice(0, 500);
    const description = formData.get("description");
    const category = formData.get("category");

    const db = createServiceClient();
    const id = crypto.randomUUID();
    const objectPath = `${id}/${sanitizeFileName(file.name)}`;

    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: upErr } = await db.storage.from(BUCKET).upload(objectPath, bytes, {
      contentType:
        file.type && file.type.length < 200 ? file.type : "application/octet-stream",
      upsert: false,
    });
    if (upErr) {
      console.error("platform-reports upload:", upErr);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    const { data: inserted, error: insErr } = await db
      .from("platform_admin_reports")
      .insert({
        id,
        name,
        description:
          description && String(description).trim()
            ? String(description).slice(0, 2000)
            : null,
        category:
          category && String(category).trim()
            ? String(category).slice(0, 200)
            : null,
        storage_bucket: BUCKET,
        storage_object_path: objectPath,
      })
      .select("id")
      .single();

    if (insErr || !inserted) {
      console.error("platform_admin_reports insert:", insErr);
      await db.storage.from(BUCKET).remove([objectPath]);
      return NextResponse.json(
        { error: insErr?.message ?? "Failed to save report" },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: inserted.id });
  } catch (e) {
    console.error("POST /api/admin/reports", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
