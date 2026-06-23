import fs from "fs/promises";
import path from "path";

export const UPLOAD_CATEGORIES = {
  pharmacyLogos: "pharmacy-logos",
  platformReports: "platform-reports",
  pharmacyFiles: "pharmacy-files",
} as const;

export type UploadCategory =
  (typeof UPLOAD_CATEGORIES)[keyof typeof UPLOAD_CATEGORIES];

function uploadRoot(): string {
  return process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(process.cwd(), "uploads");
}

function resolveUploadPath(category: UploadCategory, objectPath: string): string {
  const normalized = objectPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.includes("..")) {
    throw new Error("Invalid upload path");
  }
  const full = path.join(uploadRoot(), category, normalized);
  const rootWithSep = path.join(uploadRoot(), category) + path.sep;
  if (!full.startsWith(rootWithSep) && full !== path.join(uploadRoot(), category)) {
    throw new Error("Invalid upload path");
  }
  return full;
}

export async function saveLocalUpload(input: {
  category: UploadCategory;
  objectPath: string;
  buffer: Buffer;
}): Promise<void> {
  const fullPath = resolveUploadPath(input.category, input.objectPath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, input.buffer);
}

export async function deleteLocalUpload(
  category: UploadCategory,
  objectPath: string,
): Promise<void> {
  try {
    await fs.unlink(resolveUploadPath(category, objectPath));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }
}

export async function readLocalUpload(
  category: UploadCategory,
  objectPath: string,
): Promise<Buffer> {
  return fs.readFile(resolveUploadPath(category, objectPath));
}

export function localUploadFileUrl(
  category: UploadCategory,
  objectPath: string,
): string {
  const segments = objectPath
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment));
  const relative = `/api/files/${category}/${segments.join("/")}`;
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return base ? `${base}${relative}` : relative;
}
