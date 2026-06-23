import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { runPgDumpBackup } from "@/lib/backups/pg-dump";
import {
  storeCreateBackup,
  storeListBackups,
} from "@/lib/db/admin-store";

export async function GET() {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const backups = await storeListBackups();
    const formattedBackups = backups.map((b) => ({
      id: b.id,
      name: b.name,
      size: b.file_size,
      path: b.file_path,
      date: b.created_at,
      status: b.status,
    }));

    return NextResponse.json(formattedBackups);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch backups" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const type = typeof body.type === "string" ? body.type : "manual";

    try {
      const dump = await runPgDumpBackup({
        type,
        pharmacyId: body.pharmacy_id ?? null,
      });

      const backup = await storeCreateBackup({
        pharmacyId: body.pharmacy_id ?? null,
        type,
        name: dump.fileName,
        fileSize: dump.fileSize,
        filePath: dump.filePath,
        status: "completed",
      });

      return NextResponse.json({ success: true, backup });
    } catch (dumpError) {
      await storeCreateBackup({
        pharmacyId: body.pharmacy_id ?? null,
        type,
        name: `${type} backup failed - ${new Date().toLocaleString()}`,
        status: "failed",
      });

      const message =
        dumpError instanceof Error ? dumpError.message : "Backup failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
