"use client";

import { useMutation } from "@tanstack/react-query";
import {
  complete2FASession,
  sendRecoveryEmail,
  sendResendConfirmationEmail,
  verify2FACode,
  type Complete2FAResponse,
  type RecoveryEmailInput,
  type ResendConfirmationInput,
  type Verify2FAInput,
} from "@/lib/http/auth";

export function useSendRecoveryEmailMutation() {
  return useMutation({
    mutationFn: (body: RecoveryEmailInput) => sendRecoveryEmail(body),
  });
}

export function useResendConfirmationMutation() {
  return useMutation({
    mutationFn: (body: ResendConfirmationInput) =>
      sendResendConfirmationEmail(body),
  });
}

export function useVerify2FAMutation() {
  return useMutation({
    mutationFn: async (input: Verify2FAInput) => {
      const verifyResult = await verify2FACode(input);
      const completeResult = await complete2FASession(input.sessionToken);
      return { verifyResult, completeResult };
    },
  });
}

export type { Complete2FAResponse };
