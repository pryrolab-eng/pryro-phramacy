export type { AuthEmailResult } from "./auth-email-types";
export { sendConfirmationResendEmail } from "./resend-confirmation";
export { isSmtpConfigured, sendMail, getDefaultFromAddress } from "./mailer";
export {
  sendNativePasswordRecoveryEmail as sendPasswordRecoveryEmail,
  sendNativeSignupConfirmationEmail as sendSignupConfirmationEmail,
  sendNativePasswordRecoveryEmail,
  sendNativeSignupConfirmationEmail,
} from "./native-auth-emails";
export { sendStaffInviteEmail, type StaffInviteEmailResult } from "./staff-invite";
