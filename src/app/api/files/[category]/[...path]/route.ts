import { NextRequest, NextResponse } from "next/server";
import path from "path";
import {
  readLocalUpload,
  UPLOAD_CATEGORIES,
  type UploadCategory,
} from "@/lib/storage/local-files";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".csv": "text/csv",
  ".json": "application/json",
  ".txt": "text/plain",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
};

function isUploadCategory(value: string): value is UploadCategory {
  return (
    value === UPLOAD_CATEGORIES.pharmacyLogos ||
    value === UPLOAD_CATEGORIES.platformReports
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ category: string; path: string[] }> },
) {
  const { category, path: segments } = await params;

  if (!isUploadCategory(category)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (category === UPLOAD_CATEGORIES.platformReports) {
    const auth = await requirePlatformAdminApi();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
  }

  const objectPath = segments.map(decodeURIComponent).join("/");
  if (!objectPath || objectPath.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (category === UPLOAD_CATEGORIES.pharmacyFiles) {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    if (!objectPath.startsWith(`${pharmacyId}/`)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  try {
    const buffer = await readLocalUpload(category, objectPath);
    const ext = path.extname(objectPath).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control":
          category === UPLOAD_CATEGORIES.pharmacyLogos
            ? "public, max-age=86400"
            : "private, no-store",
      },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("GET /api/files:", error);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
