import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type PaymentTransactionRow = {
  id: string;
  pharmacy_id: string | null;
  sale_id: string | null;
  subscription_id: string | null;
  amount: number;
  currency: string | null;
  payment_method: string;
  bank_id: string | null;
  bank_name: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_number: string | null;
  status: string | null;
  mom_transaction_id: string | null;
  pay_account: string | null;
  payment_details: string | null;
  error_message: string | null;
  webhook_received_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  payment_provider: string;
  polar_checkout_id: string | null;
};

function mapPaymentTransaction(row: {
  id: string;
  pharmacy_id: string | null;
  sale_id: string | null;
  subscription_id: string | null;
  amount: unknown;
  currency: string | null;
  payment_method: string;
  bank_id: string | null;
  bank_name: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  customer_number: string | null;
  status: string | null;
  mom_transaction_id: string | null;
  pay_account: string | null;
  payment_details: string | null;
  error_message: string | null;
  webhook_received_at: Date | null;
  completed_at: Date | null;
  created_at: Date | null;
  payment_provider: string;
  polar_checkout_id: string | null;
}): PaymentTransactionRow {
  return {
    id: row.id,
    pharmacy_id: row.pharmacy_id,
    sale_id: row.sale_id,
    subscription_id: row.subscription_id,
    amount: Number(row.amount),
    currency: row.currency,
    payment_method: row.payment_method,
    bank_id: row.bank_id,
    bank_name: row.bank_name,
    customer_name: row.customer_name,
    customer_phone: row.customer_phone,
    customer_email: row.customer_email,
    customer_number: row.customer_number,
    status: row.status,
    mom_transaction_id: row.mom_transaction_id,
    pay_account: row.pay_account,
    payment_details: row.payment_details,
    error_message: row.error_message,
    webhook_received_at: row.webhook_received_at?.toISOString() ?? null,
    completed_at: row.completed_at?.toISOString() ?? null,
    created_at: row.created_at?.toISOString() ?? null,
    payment_provider: row.payment_provider,
    polar_checkout_id: row.polar_checkout_id,
  };
}

export async function linkPaymentTransactionToSubscriptionFromDb(input: {
  transactionId: string;
  subscriptionId: string;
}): Promise<void> {
  await prisma.payment_transactions.update({
    where: { id: input.transactionId },
    data: { subscription_id: input.subscriptionId },
  });
}

export async function createPaymentTransactionFromDb(
  data: Prisma.payment_transactionsCreateInput,
): Promise<PaymentTransactionRow> {
  const row = await prisma.payment_transactions.create({ data });
  return mapPaymentTransaction(row);
}

export async function updatePaymentTransactionFromDb(
  id: string,
  data: Prisma.payment_transactionsUpdateInput,
): Promise<void> {
  await prisma.payment_transactions.update({ where: { id }, data });
}

export async function findPaymentTransactionByIdFromDb(
  id: string,
): Promise<PaymentTransactionRow | null> {
  const row = await prisma.payment_transactions.findUnique({ where: { id } });
  return row ? mapPaymentTransaction(row) : null;
}

export async function findPaymentTransactionByPolarCheckoutIdFromDb(
  checkoutId: string,
): Promise<PaymentTransactionRow | null> {
  const row = await prisma.payment_transactions.findFirst({
    where: { polar_checkout_id: checkoutId },
  });
  return row ? mapPaymentTransaction(row) : null;
}

export async function insertPaymentLogFromDb(input: {
  transactionId: string;
  eventType: string;
  payload?: unknown;
  response?: unknown;
  errorMessage?: string | null;
}): Promise<void> {
  await prisma.payment_logs.create({
    data: {
      transaction_id: input.transactionId,
      event_type: input.eventType,
      payload: input.payload != null ? (input.payload as Prisma.InputJsonValue) : undefined,
      response: input.response != null ? (input.response as Prisma.InputJsonValue) : undefined,
      error_message: input.errorMessage ?? null,
    },
  });
}
