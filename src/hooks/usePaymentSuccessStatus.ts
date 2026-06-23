"use client";

import { useQuery } from "@tanstack/react-query";
import { getPolarCheckoutStatus, polarKeys } from "@/lib/http/polar";

export type PaymentVerificationResult = {
  status: "completed" | "failed" | "pending";
  message: string;
};

async function verifyPaymentStatus(checkoutId: string): Promise<PaymentVerificationResult> {
  const data = await getPolarCheckoutStatus(checkoutId);
  if (data.status === "completed") {
    return {
      status: "completed",
      message: "Your subscription is active. You can continue setup.",
    };
  }
  if (data.status === "failed") {
    return {
      status: "failed",
      message: "Payment failed. Please try again.",
    };
  }
  return {
    status: "pending",
    message: "Payment is still processing. Check Settings in a few minutes.",
  };
}

export function usePaymentSuccessStatus(checkoutId: string | null) {
  return useQuery({
    queryKey: ["payment-success-status", checkoutId],
    queryFn: () => verifyPaymentStatus(checkoutId!),
    enabled: !!checkoutId,
    retry: false,
  });
}
