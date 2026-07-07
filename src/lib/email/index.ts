export type { AuthEmailResult } from "./auth-email-types";
export { sendConfirmationResendEmail } from "./resend-confirmation";
export { isSmtpConfigured, sendMail, getDefaultFromAddress } from "./mailer";
export {
  sendNativePasswordRecoveryEmail as sendPasswordRecoveryEmail,
  sendNativeSignupConfirmationEmail as sendSignupConfirmationEmail,
  sendNativePasswordRecoveryEmail,
  sendNativeSignupConfirmationEmail,
} from "./native-auth-emails";
export { sendStaffInviteEmail, type StaffInviteEmailResult, staffInviteEmailHtml, staffInviteEmailText } from "./staff-invite";
export { paymentReceiptEmailHtml, paymentReceiptEmailText } from "./payment-receipt";
export { adminNoticeEmailHtml, adminNoticeEmailText } from "./admin-notice-email";
export { maintenanceNoticeEmailHtml, maintenanceNoticeEmailText } from "./maintenance-email";
export { invitationEmailHtml, invitationCredentialsBlock } from "./invitation-email";
export { pryroxEmailLayout } from "./layout";
export { authEmailLayout, confirmationEmailHtml, recoveryEmailHtml } from "./templates";
