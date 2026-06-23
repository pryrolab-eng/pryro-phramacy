import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { prisma } from "@/lib/db/prisma";
import { requireSessionPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import {
  localUploadFileUrl,
  saveLocalUpload,
  UPLOAD_CATEGORIES,
} from "@/lib/storage/local-files";

type ExportFormat = "csv" | "json";
type ExportType = "sales" | "customers" | "inventory";

function isExportType(value: unknown): value is ExportType {
  return value === "sales" || value === "customers" || value === "inventory";
}

function isExportFormat(value: unknown): value is ExportFormat {
  return value === "csv" || value === "json";
}

function csvValue(value: unknown): string {
  if (value == null) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.map(csvValue).join(","),
    ...rows.map((row) => headers.map((key) => csvValue(row[key])).join(",")),
  ].join("\n");
}

function fileSafe(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
}

async function loadRows(
  pharmacyId: string,
  type: ExportType,
): Promise<Array<Record<string, unknown>>> {
  if (type === "customers") {
    return prisma.customers.findMany({
      where: { pharmacy_id: pharmacyId },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        insurance_number: true,
        is_active: true,
        created_at: true,
      },
    });
  }

  if (type === "inventory") {
    const rows = await prisma.inventory.findMany({
      where: { pharmacy_id: pharmacyId },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        batch_number: true,
        quantity_in_stock: true,
        minimum_stock_level: true,
        selling_price: true,
        expiry_date: true,
        medications: { select: { name: true, category: true } },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      medication: row.medications?.name ?? "",
      category: row.medications?.category ?? "",
      batch_number: row.batch_number,
      quantity_in_stock: row.quantity_in_stock,
      minimum_stock_level: row.minimum_stock_level,
      selling_price: row.selling_price?.toString() ?? "",
      expiry_date: row.expiry_date,
    }));
  }

  const rows = await prisma.sales.findMany({
    where: { pharmacy_id: pharmacyId },
    orderBy: { created_at: "desc" },
    take: 5000,
    select: {
      id: true,
      receipt_number: true,
      customer_name: true,
      customer_phone: true,
      payment_method: true,
      total_amount: true,
      status: true,
      created_at: true,
    },
  });

  return rows.map((row) => ({
    ...row,
    total_amount: row.total_amount?.toString() ?? "0",
  }));
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pharmacyId = await requireSessionPharmacyId(user.id);
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const type = isExportType(body.type) ? body.type : "sales";
    const format = isExportFormat(body.format) ? body.format : "csv";
    const rows = await loadRows(pharmacyId, type);
    const date = new Date().toISOString().slice(0, 10);
    const filename = `${fileSafe(type)}-export-${date}.${format}`;
    const objectPath = `${pharmacyId}/exports/${Date.now()}-${filename}`;
    const content =
      format === "json" ? JSON.stringify(rows, null, 2) : toCsv(rows);
    const buffer = Buffer.from(content, "utf8");

    await saveLocalUpload({
      category: UPLOAD_CATEGORIES.pharmacyFiles,
      objectPath,
      buffer,
    });

    const downloadUrl = localUploadFileUrl(
      UPLOAD_CATEGORIES.pharmacyFiles,
      objectPath,
    );

    return NextResponse.json({
      success: true,
      export: {
        id: objectPath,
        type,
        format,
        filename,
        size: `${buffer.byteLength} bytes`,
        rowCount: rows.length,
        downloadUrl,
        createdAt: new Date().toISOString(),
        status: "ready",
      },
    });
  } catch (error) {
    console.error("POST /api/exports", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
