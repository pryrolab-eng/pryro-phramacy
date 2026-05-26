"use client";

import { useMutation } from "@tanstack/react-query";
import {
  getKpayTransactionStatus,
  initiateKpayPayment,
  type InitiateKpayPaymentInput,
} from "@/lib/http/kpay";

export {
  kpayKeys,
  type InitiateKpayPaymentInput,
  type InitiateKpayPaymentResponse,
  type KpayStatusResponse,
} from "@/lib/http/kpay";

export async function pollKpayTransactionStatus(transactionId: string) {
  return getKpayTransactionStatus(transactionId);
}

export function useInitiateKpayPaymentMutation() {
  return useMutation({
    mutationFn: (body: InitiateKpayPaymentInput) => initiateKpayPayment(body),
  });
}
