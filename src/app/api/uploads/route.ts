import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  localUploadFileUrl,
  saveLocalUpload,
  UPLOAD_CATEGORIES,
} from "@/lib/storage/local-files";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function safeFileName(name: string): string {
  const trimmed = name.trim() || "upload";
  const parts = trimmed.split(".");
  const ext = parts.length > 1 ? `.${parts.pop()}` : "";
  const base = parts.join(".") || trimmed;
  return `${base.replace(/[^a-zA-Z0-9-_]+/g, "-").replace(/^-|-$/g, "") || "upload"}${ext.replace(/[^a-zA-Z0-9.]/g, "")}`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File is larger than the 10 MB limit" },
        { status: 413 },
      );
    }

    const filename = safeFileName(file.name);
    const objectPath = `${pharmacyId}/uploads/${Date.now()}-${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    await saveLocalUpload({
      category: UPLOAD_CATEGORIES.pharmacyFiles,
      objectPath,
      buffer,
    });

    return NextResponse.json({
      success: true,
      upload: {
        id: objectPath,
        filename,
        size: file.size,
        type: file.type || "application/octet-stream",
        url: localUploadFileUrl(UPLOAD_CATEGORIES.pharmacyFiles, objectPath),
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("POST /api/uploads", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
