import {
  createPaymentTransactionFromDb,
  findPaymentTransactionByIdFromDb,
  findPaymentTransactionByPolarCheckoutIdFromDb,
  insertPaymentLogFromDb,
  linkPaymentTransactionToSubscriptionFromDb,
  updatePaymentTransactionFromDb,
  type PaymentTransactionRow,
} from "@/lib/db/payment-transactions";

export type { PaymentTransactionRow };

export async function storeLinkPaymentTransactionToSubscription(input: {
  transactionId: string;
  subscriptionId: string;
}): Promise<void> {
  return linkPaymentTransactionToSubscriptionFromDb(input);
}

export async function storeCreatePaymentTransaction(
  data: Record<string, unknown>,
): Promise<PaymentTransactionRow> {
  return createPaymentTransactionFromDb({
    pharmacies: data.pharmacy_id
      ? { connect: { id: data.pharmacy_id as string } }
      : undefined,
    sales: data.sale_id
      ? { connect: { id: data.sale_id as string } }
      : undefined,
    subscriptions: data.subscription_id
      ? { connect: { id: data.subscription_id as string } }
      : undefined,
    amount: data.amount as number,
    currency: (data.currency as string) ?? "RWF",
    payment_method: data.payment_method as string,
    bank_id: (data.bank_id as string | null) ?? undefined,
    bank_name: (data.bank_name as string | null) ?? undefined,
    customer_name: data.customer_name as string,
    customer_phone: (data.customer_phone as string | null) ?? undefined,
    customer_email: (data.customer_email as string | null) ?? undefined,
    customer_number: (data.customer_number as string | null) ?? undefined,
    payment_details: (data.payment_details as string | null) ?? undefined,
    status: (data.status as string) ?? "pending",
    payment_provider: (data.payment_provider as string) ?? "polar",
    polar_checkout_id: (data.polar_checkout_id as string | null) ?? undefined,
    error_message: (data.error_message as string | null) ?? undefined,
  });
}

export async function storeUpdatePaymentTransaction(
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  const prismaData: Record<string, unknown> = { ...data };
  if (typeof prismaData.completed_at === "string") {
    prismaData.completed_at = new Date(prismaData.completed_at);
  }
  if (typeof prismaData.webhook_received_at === "string") {
    prismaData.webhook_received_at = new Date(prismaData.webhook_received_at);
  }
  await updatePaymentTransactionFromDb(id, prismaData);
}

export async function storeFindPaymentTransactionById(
  id: string,
): Promise<PaymentTransactionRow | null> {
  return findPaymentTransactionByIdFromDb(id);
}

export async function storeFindPaymentTransactionByPolarCheckoutId(
  checkoutId: string,
): Promise<PaymentTransactionRow | null> {
  return findPaymentTransactionByPolarCheckoutIdFromDb(checkoutId);
}

export async function storeInsertPaymentLog(input: {
  transactionId: string;
  eventType: string;
  payload?: unknown;
  response?: unknown;
  errorMessage?: string | null;
}): Promise<void> {
  return insertPaymentLogFromDb(input);
}
