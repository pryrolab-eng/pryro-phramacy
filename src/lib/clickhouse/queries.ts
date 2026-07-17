import { getClickHouseClient, getClickHouseConfig } from "./client";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

type Scope = {
  pharmacyId: string;
  branchId?: string | null;
};

function dayIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function branchClause(branchId?: string | null): string {
  return branchId ? "AND branch_id = {branchId:UUID}" : "";
}

function scopeParams(scope: Scope, extra: Record<string, unknown> = {}) {
  return {
    pharmacyId: scope.pharmacyId,
    ...(scope.branchId ? { branchId: scope.branchId } : {}),
    ...extra,
  };
}

/** Dashboard card metrics from daily_sales_agg (SummingMergeTree). */
export async function queryDashboardSalesTotals(input: {
  pharmacyId: string;
  branchId?: string | null;
  fromDay: string;
  toDay: string;
}): Promise<{
  revenue: number;
  orders: number;
  insuranceRevenue: number;
  customerRevenue: number;
}> {
  const ch = getClickHouseClient();
  const { database } = getClickHouseConfig();

  const result = await ch.query({
    query: `
      SELECT
        sum(revenue) AS revenue,
        sum(orders) AS orders,
        sum(insurance_revenue) AS insurance_revenue,
        sum(customer_revenue) AS customer_revenue
      FROM ${database}.daily_sales_agg
      WHERE pharmacy_id = {pharmacyId:UUID}
        AND day >= {fromDay:Date}
        AND day <= {toDay:Date}
        ${branchClause(input.branchId)}
    `,
    query_params: scopeParams(input, {
      fromDay: input.fromDay,
      toDay: input.toDay,
    }),
    format: "JSONEachRow",
  });

  const rows = await result.json<{
    revenue: string | number;
    orders: string | number;
    insurance_revenue: string | number;
    customer_revenue: string | number;
  }>();

  const row = rows[0];
  return {
    revenue: Number(row?.revenue ?? 0),
    orders: Number(row?.orders ?? 0),
    insuranceRevenue: Number(row?.insurance_revenue ?? 0),
    customerRevenue: Number(row?.customer_revenue ?? 0),
  };
}

export async function queryTodaySalesTotal(
  scope: Scope,
  todayIso: string,
): Promise<number> {
  const totals = await queryDashboardSalesTotals({
    ...scope,
    fromDay: todayIso,
    toDay: todayIso,
  });
  return totals.revenue;
}

export async function queryCategorySales(input: {
  pharmacyId: string;
  branchId?: string | null;
  fromDay: string;
  toDay: string;
  limit?: number;
}): Promise<Array<{ category: string; revenue: number; quantity: number }>> {
  const ch = getClickHouseClient();
  const { database } = getClickHouseConfig();

  const result = await ch.query({
    query: `
      SELECT
        category,
        sum(revenue) AS revenue,
        sum(quantity) AS quantity
      FROM ${database}.category_sales_agg
      WHERE pharmacy_id = {pharmacyId:UUID}
        AND day >= {fromDay:Date}
        AND day <= {toDay:Date}
        ${branchClause(input.branchId)}
      GROUP BY category
      ORDER BY revenue DESC
      LIMIT {limit:UInt32}
    `,
    query_params: scopeParams(input, {
      fromDay: input.fromDay,
      toDay: input.toDay,
      limit: input.limit ?? 12,
    }),
    format: "JSONEachRow",
  });

  const rows = await result.json<{
    category: string;
    revenue: string | number;
    quantity: string | number;
  }>();

  return rows.map((r) => ({
    category: r.category || "other",
    revenue: Number(r.revenue ?? 0),
    quantity: Number(r.quantity ?? 0),
  }));
}

/** Shape matches buildCategorySalesChart output. */
export async function queryCategorySalesChart(
  scope: Scope,
  days = 180,
): Promise<Array<{ category: string; sales: number; fill: string }>> {
  const to = new Date();
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await queryCategorySales({
    ...scope,
    fromDay: dayIso(from),
    toDay: dayIso(to),
    limit: 20,
  });
  return rows.map((r) => ({
    category: r.category,
    sales: Math.round(r.revenue),
    fill: `var(--color-${r.category})`,
  }));
}

/** Shape matches buildMonthlySalesChart output. */
export async function queryMonthlySalesChart(
  scope: Scope,
): Promise<Array<{ month: string; revenue: number }>> {
  const ch = getClickHouseClient();
  const { database } = getClickHouseConfig();
  const from = dayIso(new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000));
  const to = dayIso(new Date());

  const result = await ch.query({
    query: `
      SELECT
        toMonth(day) AS month_num,
        sum(revenue) AS revenue
      FROM ${database}.daily_sales_agg
      WHERE pharmacy_id = {pharmacyId:UUID}
        AND day >= {fromDay:Date}
        AND day <= {toDay:Date}
        ${branchClause(scope.branchId)}
      GROUP BY month_num
      ORDER BY month_num
    `,
    query_params: scopeParams(scope, { fromDay: from, toDay: to }),
    format: "JSONEachRow",
  });

  const rows = await result.json<{
    month_num: number;
    revenue: string | number;
  }>();

  return rows.map((r) => ({
    month: MONTHS[Math.max(0, Math.min(11, Number(r.month_num) - 1))] ?? "?",
    revenue: Math.round(Number(r.revenue ?? 0)),
  }));
}

/** Shape matches buildWeeklySalesChart output. */
export async function queryWeeklySalesChart(
  scope: Scope,
): Promise<Array<{ day: string; prescription: number; otc: number }>> {
  const ch = getClickHouseClient();
  const { database } = getClickHouseConfig();
  const from = dayIso(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const to = dayIso(new Date());

  const result = await ch.query({
    query: `
      SELECT
        toDayOfWeek(sold_at) AS dow,
        category,
        sum(total_price) AS revenue
      FROM ${database}.sale_items_fact
      WHERE pharmacy_id = {pharmacyId:UUID}
        AND toDate(sold_at) >= {fromDay:Date}
        AND toDate(sold_at) <= {toDay:Date}
        ${branchClause(scope.branchId)}
      GROUP BY dow, category
    `,
    query_params: scopeParams(scope, { fromDay: from, toDay: to }),
    format: "JSONEachRow",
  });

  // ClickHouse toDayOfWeek: Monday=1 … Sunday=7
  const daily: Record<string, { prescription: number; otc: number }> = {};
  for (const day of WEEKDAYS) daily[day] = { prescription: 0, otc: 0 };

  const rows = await result.json<{
    dow: number;
    category: string;
    revenue: string | number;
  }>();

  for (const r of rows) {
    const day = WEEKDAYS[Math.max(0, Math.min(6, Number(r.dow) - 1))]!;
    const amount = Number(r.revenue ?? 0);
    if (r.category === "prescription") daily[day]!.prescription += amount;
    else daily[day]!.otc += amount;
  }

  return WEEKDAYS.map((day) => ({
    day,
    prescription: Math.round(daily[day]?.prescription ?? 0),
    otc: Math.round(daily[day]?.otc ?? 0),
  }));
}

export async function queryActiveCustomerCount(
  scope: Scope,
  range: { from: string; to: string },
): Promise<number> {
  const ch = getClickHouseClient();
  const { database } = getClickHouseConfig();
  const result = await ch.query({
    query: `
      SELECT uniqExact(customer_name) AS customers
      FROM ${database}.sales_fact FINAL
      WHERE pharmacy_id = {pharmacyId:UUID}
        AND status = 'completed'
        AND customer_name IS NOT NULL
        AND customer_name != ''
        AND toDate(created_at) >= {fromDay:Date}
        AND toDate(created_at) <= {toDay:Date}
        ${branchClause(scope.branchId)}
    `,
    query_params: scopeParams(scope, {
      fromDay: range.from.slice(0, 10),
      toDay: range.to.slice(0, 10),
    }),
    format: "JSONEachRow",
  });
  const rows = await result.json<{ customers: string | number }>();
  return Number(rows[0]?.customers ?? 0);
}

/** Shape matches buildSalesReportPayload (without needing raw sale rows). */
export async function querySalesReport(
  scope: Scope,
  range: { from: string; to: string },
): Promise<{
  dailySales: Array<{ date: string; sales: number; orders: number }>;
  topProducts: Array<{ name: string; sales: number; quantity: number }>;
  paymentBreakdown: Array<{
    method: string;
    percentage: number;
    amount: number;
  }>;
  totalSales: number;
  totalOrders: number;
  activeCustomers: number;
  branchId: string | null;
}> {
  const ch = getClickHouseClient();
  const { database } = getClickHouseConfig();
  const fromDay = range.from.slice(0, 10);
  const toDay = range.to.slice(0, 10);
  const bc = branchClause(scope.branchId);
  const params = scopeParams(scope, { fromDay, toDay });

  const [dailyResult, productsResult, paymentResult, customersResult] =
    await Promise.all([
      ch.query({
        query: `
          SELECT
            toString(day) AS date,
            sum(revenue) AS sales,
            sum(orders) AS orders
          FROM ${database}.daily_sales_agg
          WHERE pharmacy_id = {pharmacyId:UUID}
            AND day >= {fromDay:Date}
            AND day <= {toDay:Date}
            ${bc}
          GROUP BY day
          ORDER BY day
        `,
        query_params: params,
        format: "JSONEachRow",
      }),
      ch.query({
        query: `
          SELECT
            medication_name AS name,
            sum(total_price) AS sales,
            sum(quantity) AS quantity
          FROM ${database}.sale_items_fact
          WHERE pharmacy_id = {pharmacyId:UUID}
            AND toDate(sold_at) >= {fromDay:Date}
            AND toDate(sold_at) <= {toDay:Date}
            ${bc}
          GROUP BY medication_name
          ORDER BY sales DESC
          LIMIT 8
        `,
        query_params: params,
        format: "JSONEachRow",
      }),
      ch.query({
        query: `
          SELECT
            payment_method,
            sum(total_amount) AS amount
          FROM ${database}.sales_fact FINAL
          WHERE pharmacy_id = {pharmacyId:UUID}
            AND status = 'completed'
            AND toDate(created_at) >= {fromDay:Date}
            AND toDate(created_at) <= {toDay:Date}
            ${bc}
          GROUP BY payment_method
        `,
        query_params: params,
        format: "JSONEachRow",
      }),
      ch.query({
        query: `
          SELECT uniqExact(customer_name) AS customers
          FROM ${database}.sales_fact FINAL
          WHERE pharmacy_id = {pharmacyId:UUID}
            AND status = 'completed'
            AND customer_name IS NOT NULL
            AND customer_name != ''
            AND toDate(created_at) >= {fromDay:Date}
            AND toDate(created_at) <= {toDay:Date}
            ${bc}
        `,
        query_params: params,
        format: "JSONEachRow",
      }),
    ]);

  const dailyRows = await dailyResult.json<{
    date: string;
    sales: string | number;
    orders: string | number;
  }>();
  const productRows = await productsResult.json<{
    name: string;
    sales: string | number;
    quantity: string | number;
  }>();
  const paymentRows = await paymentResult.json<{
    payment_method: string;
    amount: string | number;
  }>();
  const customerRows = await customersResult.json<{ customers: string | number }>();

  const dailySales = dailyRows.map((r) => ({
    date: r.date.slice(0, 10),
    sales: Math.round(Number(r.sales ?? 0)),
    orders: Number(r.orders ?? 0),
  }));

  const totalSales = dailySales.reduce((s, r) => s + r.sales, 0);
  const totalOrders = dailySales.reduce((s, r) => s + r.orders, 0);

  const paymentLabel = (m: string) => {
    if (m === "mobile_money") return "Mobile Money";
    if (m === "cash") return "Cash";
    if (m === "insurance") return "Insurance";
    return "Card";
  };

  const paymentAmounts = paymentRows.map((r) => ({
    method: paymentLabel(r.payment_method),
    amount: Math.round(Number(r.amount ?? 0)),
  }));
  const paymentTotal = paymentAmounts.reduce((s, r) => s + r.amount, 0);

  return {
    dailySales,
    topProducts: productRows.map((r) => ({
      name: r.name,
      sales: Math.round(Number(r.sales ?? 0)),
      quantity: Number(r.quantity ?? 0),
    })),
    paymentBreakdown: paymentAmounts.map((r) => ({
      method: r.method,
      amount: r.amount,
      percentage:
        paymentTotal > 0 ? Math.round((r.amount / paymentTotal) * 100) : 0,
    })),
    totalSales,
    totalOrders,
    activeCustomers: Number(customerRows[0]?.customers ?? 0),
    branchId: scope.branchId ?? null,
  };
}
