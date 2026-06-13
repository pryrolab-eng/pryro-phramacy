import { prisma } from "@/lib/db/prisma";
import { adminGetAuthUserById } from "@/lib/auth/admin-users";
import { storeFindPublicUserIdByEmail } from "@/lib/db/public-users-store";

/** Shown in API + toast — does not reveal whether the email exists in Pryrox. */
export const STAFF_INVITE_EMAIL_REJECTED_MESSAGE =
  "This email can't be used for a team member. Ask them to sign in with a different work email.";

export const STAFF_INVITE_EMAIL_REJECTED_CODE = "email_unavailable" as const;

export class StaffInviteEmailRejectedError extends Error {
  readonly code = STAFF_INVITE_EMAIL_REJECTED_CODE;

  constructor(message = STAFF_INVITE_EMAIL_REJECTED_MESSAGE) {
    super(message);
    this.name = "StaffInviteEmailRejectedError";
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isAuthDuplicateEmailError(error: unknown): boolean {
  const message =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: string }).message).toLowerCase()
      : "";
  return (
    message.includes("already") ||
    message.includes("registered") ||
    message.includes("exists") ||
    message.includes("duplicate") ||
    message.includes("unique")
  );
}

/**
 * Staff invites must use a dedicated work email.
 * Pharmacy owner may use the same address for login and `pharmacies.email` at signup only.
 */
export async function assertStaffInviteEmailAllowed(
  pharmacyId: string,
  rawEmail: string,
): Promise<void> {
  const email = normalizeEmail(rawEmail);
  if (!email) {
    throw new StaffInviteEmailRejectedError(
      "A valid email address is required for this team member.",
    );
  }

  const pharmacy = await prisma.pharmacies.findUnique({
    where: { id: pharmacyId },
    select: { owner_id: true, email: true },
  });

  const businessEmail = pharmacy?.email ? normalizeEmail(pharmacy.email) : null;

  let ownerAuthEmail: string | null = null;
  if (pharmacy?.owner_id) {
    const ownerAuth = await adminGetAuthUserById(pharmacy.owner_id);
    ownerAuthEmail = ownerAuth?.email ? normalizeEmail(ownerAuth.email) : null;
  }

  if (email === businessEmail || email === ownerAuthEmail) {
    throw new StaffInviteEmailRejectedError();
  }

  const existingUserId = await storeFindPublicUserIdByEmail(email);
  if (existingUserId) {
    throw new StaffInviteEmailRejectedError();
  }
}

export function mapCreateUserErrorForStaffInvite(error: unknown): never {
  if (isAuthDuplicateEmailError(error)) {
    throw new StaffInviteEmailRejectedError();
  }
  throw error instanceof Error ? error : new Error("Failed to create team member");
}
