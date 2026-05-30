import type { StaffInviteEmailResult } from "@/lib/email/staff-invite";
import { getSignInUrl } from "@/lib/app-url";

export type StaffInviteCredentialsPayload = {
  email: string;
  temporaryPassword: string;
  signInUrl: string;
};

export function buildStaffInviteApiPayload(options: {
  email: string;
  temporaryPassword: string;
  emailResult: StaffInviteEmailResult;
  userId?: string;
  messageWhenEmailOk: string;
  messageWhenEmailFailed: string;
}) {
  const { email, temporaryPassword, emailResult } = options;
  return {
    success: true as const,
    message: emailResult.ok
      ? options.messageWhenEmailOk
      : options.messageWhenEmailFailed,
    userId: options.userId,
    emailSent: emailResult.ok,
    emailError: emailResult.ok ? undefined : emailResult.error,
    ...(emailResult.ok
      ? {}
      : {
          credentials: {
            email,
            temporaryPassword,
            signInUrl: getSignInUrl(),
          } satisfies StaffInviteCredentialsPayload,
        }),
  };
}
