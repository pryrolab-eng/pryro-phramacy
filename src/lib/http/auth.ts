import { fetchJson } from "./client";

export type RecoveryEmailInput = {
  email: string;
  next?: string;
};

export type RecoveryEmailResponse = {
  message?: string;
  error?: string;
};

export async function sendRecoveryEmail(
  body: RecoveryEmailInput,
): Promise<RecoveryEmailResponse> {
  return fetchJson<RecoveryEmailResponse>("/api/auth/recovery-email", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type ResendConfirmationInput = {
  email: string;
};

export type ResendConfirmationResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

export async function sendResendConfirmationEmail(
  body: ResendConfirmationInput,
): Promise<ResendConfirmationResponse> {
  return fetchJson<ResendConfirmationResponse>(
    "/api/auth/resend-confirmation",
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export type Verify2FAInput = {
  sessionToken: string | null;
  token: string;
};

export type Verify2FAResponse = {
  error?: string;
  [key: string]: unknown;
};

export async function verify2FACode(
  body: Verify2FAInput,
): Promise<Verify2FAResponse> {
  return fetchJson<Verify2FAResponse>("/api/auth/verify-2fa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export type Complete2FAResponse = {
  token?: string;
  type?: string;
  nativeSession?: boolean;
  error?: string;
};

export async function complete2FASession(sessionToken: string | null): Promise<Complete2FAResponse> {
  return fetchJson<Complete2FAResponse>("/api/auth/complete-2fa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionToken }),
  });
}
