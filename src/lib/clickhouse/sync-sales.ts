/**
 * Sync completed sales + line items from Postgres → ClickHouse.
 * Incremental by sales.updated_at watermark in sync_state.
 */

import { prisma } from "@/lib/db/prisma";
import {
  getClickHouseClient,
  getClickHouseConfig,
  isClickHouseConfigured,
  pingClickHouse,
} from "@/lib/clickhouse/client";

const STREAM = "sales";
const BATCH = 500;

const NIL_BRANCH = "00000000-0000-0000-0000-000000000000";

function decimal(value: { toString(): string } | null | undefined): string {
  if (value == null) return "0";
  return Number(value).toFixed(2);
}

function chDateTime(d: Date): string {
  return d.toISOString().replace("T", " ").replace("Z", "");
}

function branchIdOrNil(id: string | null | undefined): string {
  return id || NIL_BRANCH;
}

async function getWatermark(): Promise<Date> {
  const ch = getClickHouseClient();
  const { database } = getClickHouseConfig();
  const result = await ch.query({
    query: `
      SELECT max(last_synced_at) AS ts
      FROM ${database}.sync_state
      WHERE stream = {stream:String}
    `,
    query_params: { stream: STREAM },
    format: "JSONEachRow",
  });
  const rows = await result.json<{ ts: string | null }>();
  const raw = rows[0]?.ts;
  if (!raw || raw.startsWith("1970")) {
    return new Date(0);
  }
  return new Date(raw);
}

async function setWatermark(at: Date, rowsSynced: number) {
  const ch = getClickHouseClient();
  const { database } = getClickHouseConfig();
  await ch.insert({
    table: `${database}.sync_state`,
    values: [
      {
        stream: STREAM,
        last_synced_at: chDateTime(at),
        rows_synced: rowsSynced,
      },
    ],
    format: "JSONEachRow",
  });
}

export async function syncSalesToClickHouse(options?: {
  pharmacyId?: string;
  full?: boolean;
}): Promise<{ sales: number; items: number; watermark: string }> {
  if (!isClickHouseConfigured() && process.env.NODE_ENV === "production") {
    throw new Error("CLICKHOUSE_URL is required");
  }

  const ping = await pingClickHouse();
  if (!ping.ok) throw new Error(ping.error ?? "ClickHouse unreachable");

  const since = options?.full ? new Date(0) : await getWatermark();

  let salesCount = 0;
  let itemsCount = 0;
  let maxUpdated = since;
  let lastId: string | undefined;
  let lastUpdated = since;

  for (;;) {
    const rows = await prisma.sales.findMany({
      where: {
        pharmacy_id: options?.pharmacyId
          ? options.pharmacyId
          : { not: null },
        OR: [
          { updated_at: { gt: lastUpdated } },
          {
            updated_at: lastUpdated,
            id: lastId ? { gt: lastId } : undefined,
          },
        ],
      },
      orderBy: [{ updated_at: "asc" }, { id: "asc" }],
      take: BATCH,
      include: {
        sale_items: {
          include: {
            inventory: {
              select: {
                medications: { select: { category: true } },
              },
            },
          },
        },
      },
    });

    if (rows.length === 0) break;

    const inserted = await insertSaleRows(rows);
    salesCount += inserted.sales;
    itemsCount += inserted.items;

    const last = rows[rows.length - 1]!;
    if (last.updated_at) {
      lastUpdated = last.updated_at;
      if (last.updated_at > maxUpdated) maxUpdated = last.updated_at;
    }
    lastId = last.id;

    if (rows.length < BATCH) break;
  }

  if (salesCount > 0 || options?.full) {
    await setWatermark(maxUpdated, salesCount);
  }

  return {
    sales: salesCount,
    items: itemsCount,
    watermark: maxUpdated.toISOString(),
  };
}

type SaleWithItems = Awaited<
  ReturnType<typeof loadSaleForClickHouse>
>;

async function loadSaleForClickHouse(saleId: string) {
  return prisma.sales.findUnique({
    where: { id: saleId },
    include: {
      sale_items: {
        include: {
          inventory: {
            select: {
              medications: { select: { category: true } },
            },
          },
        },
      },
    },
  });
}

async function insertSaleRows(rows: NonNullable<SaleWithItems>[]) {
  const ch = getClickHouseClient();
  const { database } = getClickHouseConfig();

  const salesValues = rows
    .filter((r) => r.pharmacy_id && r.created_at)
    .map((r) => ({
      sale_id: r.id,
      pharmacy_id: r.pharmacy_id!,
      branch_id: branchIdOrNil(r.branch_id),
      cashier_id: r.cashier_id,
      customer_id: r.customer_id,
      customer_name: r.customer_name,
      created_at: chDateTime(r.created_at!),
      total_amount: decimal(r.total_amount),
      insurance_amount: decimal(r.insurance_amount),
      customer_amount: decimal(r.customer_amount),
      payment_method: r.payment_method ?? "cash",
      status: r.status ?? "completed",
    }));

  const itemValues = rows.flatMap((r) => {
    if (!r.pharmacy_id || !r.created_at) return [];
    const soldAt = chDateTime(r.created_at);
    return r.sale_items.map((item) => ({
      sale_item_id: item.id,
      sale_id: r.id,
      pharmacy_id: r.pharmacy_id!,
      branch_id: branchIdOrNil(r.branch_id),
      sold_at: soldAt,
      medication_name: item.medication_name,
      category: item.inventory?.medications?.category ?? "other",
      quantity: item.quantity,
      unit_price: decimal(item.unit_price),
      total_price: decimal(item.total_price),
    }));
  });

  if (salesValues.length > 0) {
    await ch.insert({
      table: `${database}.sales_fact`,
      values: salesValues,
      format: "JSONEachRow",
    });
  }
  if (itemValues.length > 0) {
    await ch.insert({
      table: `${database}.sale_items_fact`,
      values: itemValues,
      format: "JSONEachRow",
    });
  }

  return { sales: salesValues.length, items: itemValues.length };
}

/**
 * Push one completed sale into ClickHouse (for near-real-time dashboards).
 * No-op when ClickHouse is not configured.
 */
export async function pushSaleToClickHouse(saleId: string): Promise<void> {
  if (!isClickHouseConfigured()) return;

  const ping = await pingClickHouse();
  if (!ping.ok) {
    throw new Error(ping.error ?? "ClickHouse unreachable");
  }

  const sale = await loadSaleForClickHouse(saleId);
  if (!sale?.pharmacy_id || !sale.created_at) return;

  const { sales } = await insertSaleRows([sale]);
  if (sales > 0 && sale.updated_at) {
    await setWatermark(sale.updated_at, sales);
  }
}

/**
 * Fire-and-forget after POS — never blocks or fails the sale response.
 */
export function scheduleSaleClickHouseSync(saleId: string): void {
  if (!isClickHouseConfigured()) return;
  void pushSaleToClickHouse(saleId).catch((err) => {
    console.warn("[clickhouse] post-sale sync failed", saleId, err);
  });
}
