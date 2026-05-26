import { fetchJson } from "./client";

export type PhoneValidationResult = {
  phone?: {
    isValid: boolean;
    formatted?: string;
    kpayBankId?: string;
  };
};

export async function validatePhoneNumber(
  phoneNumber: string,
): Promise<PhoneValidationResult> {
  return fetchJson<PhoneValidationResult>("/api/test-validation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber }),
  });
}
