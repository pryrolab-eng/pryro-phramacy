import type { AuthEmailResult } from "@/lib/email/auth-email-types";

import { sendNativeConfirmationResendEmail } from "@/lib/email/native-auth-emails";



/**

 * Resend signup confirmation for an existing unconfirmed account.

 * Always prefer generic success responses at the API layer for unknown emails.

 */

export async function sendConfirmationResendEmail(

  email: string,

  redirectTo = "/onboarding",

): Promise<AuthEmailResult> {

  return sendNativeConfirmationResendEmail(email.trim(), redirectTo);

}

