export { isSupabaseEmailRateLimited } from "./supabase-rate-limit";
export { sendConfirmationResendEmail } from "./resend-confirmation";
export { isSmtpConfigured, sendMail, getDefaultFromAddress } from "./mailer";
export {
  sendPasswordRecoveryEmail,
  sendSignupConfirmationEmail,
  type AuthEmailResult,
} from "./auth-emails";
export { sendStaffInviteEmail, type StaffInviteEmailResult } from "./staff-invite";
