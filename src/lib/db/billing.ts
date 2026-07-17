import type { subscription_plan } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { findPaymentTransactionByIdFromDb } from "@/lib/db/payment-transactions";

function invoiceNumberFromDate(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `INV-${ymd}-${suffix}`;
}

function planNameFromDetails(details: string | null | undefined): string {
  if (!details) return "Subscription";
  const match = details.match(/^(.+?)\s+subscription/i);
  return match?.[1]?.trim() || details;
}

export type RecordSubscriptionPaymentResult = {
  recorded: boolean;
  invoiceId?: string;
  emailSent?: boolean;
  pharmacyId?: string;
  pharmacyName?: string;
  customerEmail?: string;
  planName?: string;
  amount?: number;
  currency?: string;
  invoiceNumber?: string;
  paymentMethodLabel?: string;
  paidAt?: string;
};

export async function paymentExistsForTransactionFromDb(
  transactionId: string,
): Promise<boolean> {
  const row = await prisma.payments.findFirst({
    where: { payment_reference: transactionId },
    select: { id: true },
  });
  return Boolean(row);
}

export type BillingHistoryRow = {
  id: string;
  date: string;
  amount: number;
  status: string;
  planName: string;
  provider: string;
  invoiceNumber?: string;
  source: "invoice" | "transaction";
};

export async function listPharmacyInvoicesFromDb(
  pharmacyId: string,
  limit = 20,
) {
  return prisma.invoices.findMany({
    where: { pharmacy_id: pharmacyId },
    orderBy: { created_at: "desc" },
    take: limit,
  });
}

export async function listPharmacyPaymentTransactionsFromDb(
  pharmacyId: string,
  limit = 20,
) {
  return prisma.payment_transactions.findMany({
    where: {
      pharmacy_id: pharmacyId,
      status: { in: ["completed", "processing", "pending", "failed"] },
    },
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      amount: true,
      status: true,
      payment_details: true,
      payment_provider: true,
      payment_method: true,
      created_at: true,
      completed_at: true,
      customer_email: true,
    },
  });
}

export async function getDefaultPharmacyPaymentMethodFromDb(
  pharmacyId: string,
) {
  return prisma.payment_methods.findFirst({
    where: { pharmacy_id: pharmacyId, is_default: true },
  });
}

export async function buildPharmacyBillingHistory(
  pharmacyId: string,
): Promise<{
  history: BillingHistoryRow[];
  nextPendingDueDate: string | null;
  nextPendingAmount: number | null;
  activeExpiresAt: string | null;
  activePaymentMethod: string | null;
  defaultPaymentMethodType: string | null;
}> {
  const [invoices, transactions, paymentMethod, activeSub] = await Promise.all([
    listPharmacyInvoicesFromDb(pharmacyId),
    listPharmacyPaymentTransactionsFromDb(pharmacyId),
    getDefaultPharmacyPaymentMethodFromDb(pharmacyId),
    prisma.subscriptions.findFirst({
      where: { pharmacy_id: pharmacyId, is_active: true },
      orderBy: { created_at: "desc" },
      select: { expires_at: true, payment_method: true },
    }),
  ]);

  const invoiceHistory: BillingHistoryRow[] = invoices.map((inv) => ({
    id: inv.id,
    date: (inv.created_at ?? inv.due_date).toISOString().split("T")[0],
    amount: Number(inv.amount ?? 0),
    status: inv.status === "paid" ? "Paid" : String(inv.status ?? "pending"),
    planName: inv.plan_name,
    provider: "invoice",
    invoiceNumber: inv.invoice_number,
    source: "invoice",
  }));

  const txHistory: BillingHistoryRow[] = transactions
    .filter(
      (tx) =>
        !invoiceHistory.some(
          (i) =>
            i.id === tx.id ||
            i.invoiceNumber?.includes(tx.id.slice(0, 8)),
        ),
    )
    .map((tx) => {
      const details = tx.payment_details ?? "Subscription";
      const planMatch = details.match(/^(.+?)\s+subscription/i);
      const paidAt = tx.completed_at ?? tx.created_at ?? new Date();
      return {
        id: tx.id,
        date: paidAt.toISOString().split("T")[0],
        amount: Number(tx.amount ?? 0),
        status:
          tx.status === "completed"
            ? "Paid"
            : String(tx.status ?? "pending").charAt(0).toUpperCase() +
              String(tx.status ?? "pending").slice(1),
        planName: planMatch?.[1]?.trim() || details,
        provider: tx.payment_provider || tx.payment_method || "payment",
        source: "transaction" as const,
      };
    });

  const history = [...invoiceHistory, ...txHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const nextPending = invoices.find((inv) => inv.status === "pending");

  return {
    history,
    nextPendingDueDate: nextPending?.due_date
      ? nextPending.due_date.toISOString().split("T")[0]
      : null,
    nextPendingAmount: nextPending ? Number(nextPending.amount ?? 0) : null,
    activeExpiresAt: activeSub?.expires_at?.toISOString() ?? null,
    activePaymentMethod: activeSub?.payment_method ?? null,
    defaultPaymentMethodType: paymentMethod?.method_type ?? null,
  };
}

export async function updatePharmacyLegacyPlanFromDb(input: {
  pharmacyId: string;
  subscriptionPlan: string;
  expiresAt: Date;
}): Promise<void> {
  await prisma.pharmacies.update({
    where: { id: input.pharmacyId },
    data: {
      subscription_plan: input.subscriptionPlan as subscription_plan,
      subscription_expires_at: input.expiresAt,
    },
  });
}

export async function createPendingPharmacyInvoiceFromDb(input: {
  pharmacyId: string;
  amount: number;
  status: string;
  dueDate: Date;
  planName: string;
}): Promise<void> {
  const invoiceNumber = invoiceNumberFromDate();
  await prisma.invoices.create({
    data: {
      pharmacy_id: input.pharmacyId,
      invoice_number: invoiceNumber,
      amount: input.amount,
      status: input.status,
      due_date: input.dueDate,
      plan_name: input.planName,
    },
  });
}

export async function recordSubscriptionPaymentFromDb(
  transactionId: string,
): Promise<RecordSubscriptionPaymentResult> {
  const exists = await paymentExistsForTransactionFromDb(transactionId);
  if (exists) {
    return { recorded: false };
  }

  const tx = await findPaymentTransactionByIdFromDb(transactionId);
  if (!tx || tx.status !== "completed" || !tx.pharmacy_id) {
    return { recorded: false };
  }

  const planName = planNameFromDetails(tx.payment_details);
  const paidAt = tx.completed_at || tx.created_at || new Date().toISOString();
  const paidDate = paidAt.split("T")[0];
  const invoiceNumber = invoiceNumberFromDate();
  const amount = Number(tx.amount ?? 0);
  const currency = String(tx.currency ?? "RWF");

  const methodLabel =
    tx.payment_provider === "polar" || tx.payment_method === "polar"
      ? "Card (Polar)"
      : tx.payment_method === "momo"
        ? "Mobile Money"
        : tx.payment_method === "cc"
          ? "Card"
          : tx.payment_method || tx.payment_provider || "Payment";

  const invoice = await prisma.invoices.create({
    data: {
      pharmacy_id: tx.pharmacy_id,
      invoice_number: invoiceNumber,
      amount,
      status: "paid",
      due_date: new Date(paidDate),
      paid_date: new Date(paidDate),
      plan_name: planName,
    },
    select: { id: true, invoice_number: true },
  });

  await prisma.payments.create({
    data: {
      pharmacy_id: tx.pharmacy_id,
      invoice_id: invoice.id,
      amount,
      payment_method: methodLabel,
      payment_reference: transactionId,
      status: "completed",
    },
  });

  const pharmacy = await prisma.pharmacies.findUnique({
    where: { id: tx.pharmacy_id },
    select: { name: true, email: true },
  });

  const recipient =
    tx.customer_email?.trim() || pharmacy?.email?.trim() || "";

  return {
    recorded: true,
    invoiceId: invoice.id,
    emailSent: false,
    pharmacyId: tx.pharmacy_id,
    pharmacyName: pharmacy?.name ?? "Your pharmacy",
    customerEmail: recipient,
    planName,
    amount,
    currency,
    invoiceNumber: invoice.invoice_number,
    paymentMethodLabel: methodLabel,
    paidAt,
  };
}
