import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { createPlatformAdminReportFromDb } from "@/lib/db/admin";
import {
  deleteLocalUpload,
  localUploadFileUrl,
  saveLocalUpload,
  UPLOAD_CATEGORIES,
} from "@/lib/storage/local-files";

const MAX_BYTES = 25 * 1024 * 1024;
const BUCKET = UPLOAD_CATEGORIES.platformReports;

function sanitizeFileName(name: string): string {
  const base = name.replace(/^.*[/\\]/, "").replace(/[^\w.\-()+ ]/g, "_");
  return base.slice(0, 180) || "report.bin";
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
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

    const id = crypto.randomUUID();
    const objectPath = `${id}/${sanitizeFileName(file.name)}`;

    const bytes = Buffer.from(await file.arrayBuffer());
    try {
      await saveLocalUpload({
        category: BUCKET,
        objectPath,
        buffer: bytes,
      });
    } catch (upErr) {
      console.error("platform-reports upload:", upErr);
      const message = upErr instanceof Error ? upErr.message : "Upload failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    try {
      const inserted = await createPlatformAdminReportFromDb({
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
        storageBucket: BUCKET,
        storageObjectPath: objectPath,
      });
      return NextResponse.json({
        id: inserted.id,
        downloadUrl: localUploadFileUrl(BUCKET, objectPath),
      });
    } catch (insErr) {
      console.error("platform_admin_reports insert:", insErr);
      await deleteLocalUpload(BUCKET, objectPath);
      const message =
        insErr instanceof Error ? insErr.message : "Failed to save report";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (e) {
    console.error("POST /api/admin/reports", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
