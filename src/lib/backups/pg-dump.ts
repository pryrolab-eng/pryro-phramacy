import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export type PgDumpResult = {
  filePath: string;
  fileSize: string;
  fileName: string;
};

function parseDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  return {
    host: url.hostname,
    port: url.port || "5432",
    database: url.pathname.replace(/^\//, ""),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function runPgDumpBackup(input?: {
  type?: string;
  pharmacyId?: string | null;
}): Promise<PgDumpResult> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const backupDir =
    process.env.BACKUP_DIR?.trim() ||
    path.join(process.cwd(), "data", "backups");
  await fs.mkdir(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const type = input?.type ?? "manual";
  const fileName = `pryrox-${type}-${stamp}.sql`;
  const filePath = path.join(backupDir, fileName);

  const conn = parseDatabaseUrl(databaseUrl);
  const args = [
    "--format=plain",
    "--no-owner",
    "--no-privileges",
    "--file",
    filePath,
    "--host",
    conn.host,
    "--port",
    conn.port,
    "--username",
    conn.user,
    conn.database,
  ];

  const env = {
    ...process.env,
    PGPASSWORD: conn.password,
  };

  try {
    await execFileAsync("pg_dump", args, { env, timeout: 10 * 60 * 1000 });
  } catch (error) {
    await fs.unlink(filePath).catch(() => undefined);
    const message =
      error instanceof Error ? error.message : "pg_dump failed";
    if (/ENOENT/i.test(message)) {
      throw new Error(
        "pg_dump not found on PATH. Install PostgreSQL client tools or set PG_DUMP_PATH.",
      );
    }
    throw new Error(message);
  }

  const stat = await fs.stat(filePath);
  if (stat.size <= 0) {
    await fs.unlink(filePath).catch(() => undefined);
    throw new Error("pg_dump produced an empty file");
  }

  return {
    filePath,
    fileName,
    fileSize: formatFileSize(stat.size),
  };
}
