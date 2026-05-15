export { isSupabaseEmailRateLimited } from "./supabase-rate-limit";
export { isSmtpConfigured, sendMail, getDefaultFromAddress } from "./mailer";
export {
  sendPasswordRecoveryEmail,
  sendSignupConfirmationEmail,
  type AuthEmailResult,
} from "./auth-emails";
