import { prisma } from "@/lib/db/prisma";

export type AccountingRange = {
  from: Date;
  to: Date;
};

export type AccountingCategoryBreakdown = {
  category: string;
  amount: number;
  source: "live" | "estimated" | "unavailable";
};

export type AccountingSummary = {
  revenue: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  categories: {
    inventory: number;
    supplierPurchases: number;
    salaries: number;
    rent: number;
    utilities: number;
    other: number;
  };
  categoryBreakdown: AccountingCategoryBreakdown[];
  cashFlow: {
    inflow: number;
    outflow: number;
    net: number;
  };
  sources: {
    revenue: "sales";
    inventory: "purchase_orders";
    supplierPurchases: "purchase_orders";
    salaries: "staff.salary_estimate";
    rent: "live.manual_entry" | "unavailable";
    utilities: "live.manual_entry" | "unavailable";
    other: "live.manual_entry" | "unavailable";
    fiscalSubmission: "deferred_rra_ebm";
  };
  paymentSummary: {
    completedPayments: number;
    completedTransactions: number;
    outstandingInvoices: number;
  };
};

function amount(value: { toString(): string } | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value);
}

function daysInRange(range: AccountingRange): number {
  const ms = range.to.getTime() - range.from.getTime();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function profitMargin(revenue: number, profit: number): number {
  return revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0;
}

export async function buildAccountingSummary(input: {
  pharmacyId: string;
  range: AccountingRange;
}): Promise<AccountingSummary> {
  const { pharmacyId, range } = input;
  const [
    salesAgg,
    purchaseOrders,
    staffRows,
    payments,
    invoices,
    transactions,
    manualExpenses,
  ] = await Promise.all([
      prisma.sales.aggregate({
        where: {
          pharmacy_id: pharmacyId,
          status: "completed",
          created_at: { gte: range.from, lt: range.to },
        },
        _sum: { total_amount: true },
      }),
      prisma.purchase_orders.findMany({
        where: {
          pharmacy_id: pharmacyId,
          order_date: { gte: range.from, lt: range.to },
          status: { notIn: ["cancelled", "voided"] },
        },
        select: { total_amount: true },
      }),
      prisma.staff.findMany({
        where: { pharmacy_id: pharmacyId, is_active: true },
        select: { salary: true },
      }),
      prisma.payments.findMany({
        where: {
          pharmacy_id: pharmacyId,
          created_at: { gte: range.from, lt: range.to },
        },
        select: { amount: true, status: true },
      }),
      prisma.invoices.findMany({
        where: {
          pharmacy_id: pharmacyId,
          created_at: { gte: range.from, lt: range.to },
        },
        select: { amount: true, status: true },
      }),
      prisma.payment_transactions.findMany({
        where: {
          pharmacy_id: pharmacyId,
          created_at: { gte: range.from, lt: range.to },
        },
        select: { amount: true, status: true },
      }),
      prisma.accounting_expenses.findMany({
        where: {
          pharmacy_id: pharmacyId,
          expense_date: { gte: range.from, lt: range.to },
        },
        select: { category: true, amount: true },
      }),
    ]);

  const revenue = amount(salesAgg._sum.total_amount);
  const supplierPurchases = purchaseOrders.reduce(
    (sum, row) => sum + amount(row.total_amount),
    0,
  );
  const monthlySalaries = staffRows.reduce(
    (sum, row) => sum + amount(row.salary),
    0,
  );
  const salaries = Math.round((monthlySalaries * daysInRange(range)) / 30.44);
  const manualExpenseTotal = manualExpenses.reduce(
    (sum, row) => sum + amount(row.amount),
    0,
  );
  const expenseByCategory = manualExpenses.reduce<Record<string, number>>(
    (acc, row) => {
      const key = row.category.trim().toLowerCase() || "other";
      acc[key] = (acc[key] ?? 0) + amount(row.amount);
      return acc;
    },
    {},
  );
  const rent = expenseByCategory.rent ?? 0;
  const utilities = expenseByCategory.utilities ?? 0;
  const other = Object.entries(expenseByCategory)
    .filter(([key]) => key !== "rent" && key !== "utilities")
    .reduce((sum, [, value]) => sum + value, 0);
  const expenses = supplierPurchases + salaries + manualExpenseTotal;
  const profit = revenue - expenses;
  const completedPayments = payments
    .filter((payment) => payment.status === "completed")
    .reduce((sum, payment) => sum + amount(payment.amount), 0);
  const completedTransactions = transactions
    .filter((tx) => tx.status === "completed" || tx.status === "success")
    .reduce((sum, tx) => sum + amount(tx.amount), 0);
  const outstandingInvoices = invoices
    .filter((invoice) => invoice.status !== "paid")
    .reduce((sum, invoice) => sum + amount(invoice.amount), 0);

  const categories = {
    inventory: supplierPurchases,
    supplierPurchases,
    salaries,
    rent,
    utilities,
    other,
  };

  return {
    revenue,
    expenses,
    profit,
    profitMargin: profitMargin(revenue, profit),
    categories,
    categoryBreakdown: [
      { category: "Inventory purchases", amount: supplierPurchases, source: "live" },
      { category: "Staff salaries", amount: salaries, source: "estimated" },
      { category: "Rent", amount: rent, source: rent > 0 ? "live" : "unavailable" },
      {
        category: "Utilities",
        amount: utilities,
        source: utilities > 0 ? "live" : "unavailable",
      },
      { category: "Other", amount: other, source: other > 0 ? "live" : "unavailable" },
    ],
    cashFlow: {
      inflow: revenue + completedPayments + completedTransactions,
      outflow: expenses,
      net: revenue + completedPayments + completedTransactions - expenses,
    },
    sources: {
      revenue: "sales",
      inventory: "purchase_orders",
      supplierPurchases: "purchase_orders",
      salaries: "staff.salary_estimate",
      rent: rent > 0 ? "live.manual_entry" : "unavailable",
      utilities: utilities > 0 ? "live.manual_entry" : "unavailable",
      other: other > 0 ? "live.manual_entry" : "unavailable",
      fiscalSubmission: "deferred_rra_ebm",
    },
    paymentSummary: {
      completedPayments,
      completedTransactions,
      outstandingInvoices,
    },
  };
}
