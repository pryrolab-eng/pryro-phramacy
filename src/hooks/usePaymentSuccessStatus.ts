"use client";

import { useQuery } from "@tanstack/react-query";
import { getKpayPaymentStatus } from "@/lib/http/kpay";
import { getPolarCheckoutStatus, polarKeys } from "@/lib/http/polar";

export type PaymentVerificationResult = {
  status: "completed" | "failed" | "pending";
  message: string;
};

async function verifyPaymentStatus(params: {
  provider: string | null;
  checkoutId: string | null;
  tid: string | null;
  refid: string | null;
}): Promise<PaymentVerificationResult> {
  if (params.provider === "polar" && params.checkoutId) {
    const data = await getPolarCheckoutStatus(params.checkoutId);
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

  if (!params.tid && !params.refid) {
    return { status: "failed", message: "Invalid payment reference." };
  }

  const data = await getKpayPaymentStatus({
    tid: params.tid,
    refid: params.refid,
  });

  if (data.transaction?.status === "completed") {
    return {
      status: "completed",
      message: "Your subscription is active. You can continue setup.",
    };
  }
  if (data.transaction?.status === "failed") {
    return {
      status: "failed",
      message: "Payment failed. Please try again.",
    };
  }
  return {
    status: "pending",
    message: "Payment is still processing. Please check back in a few minutes.",
  };
}

export function usePaymentSuccessStatus(params: {
  provider: string | null;
  checkoutId: string | null;
  tid: string | null;
  refid: string | null;
}) {
  return useQuery({
    queryKey: [
      "payment-success",
      params.provider,
      params.checkoutId,
      params.tid,
      params.refid,
    ],
    queryFn: () => verifyPaymentStatus(params),
    retry: false,
  });
}
