import {
  recordSubscriptionPaymentFromDb,
  type RecordSubscriptionPaymentResult,
} from "@/lib/db/billing";

export type { RecordSubscriptionPaymentResult };

export async function storeRecordSubscriptionPayment(
  transactionId: string,
): Promise<RecordSubscriptionPaymentResult> {
  return recordSubscriptionPaymentFromDb(transactionId);
}
