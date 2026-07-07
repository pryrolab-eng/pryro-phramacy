import { sendStaffInviteEmail } from "@/lib/email/staff-invite";
import { adminCreateAuthUser } from "@/lib/auth/admin-users";
import { staffInviteUserMetadata } from "@/lib/auth/must-change-password";
import { auditRequestMetadata, writeAuditLog } from "@/lib/db/audit-logs";
import { storeCreatePharmacyMembership } from "@/lib/db/pharmacy-users-store";
import { generateTemporaryPassword } from "@/lib/staff/temporary-password";
import {
  assertStaffInviteEmailAllowed,
  mapCreateUserErrorForStaffInvite,
  StaffInviteEmailRejectedError,
} from "@/lib/staff/staff-invite-email";
import { buildStaffInviteApiPayload } from "@/lib/staff/staff-invite-response";

export type InvitePharmacyStaffInput = {
  pharmacyId: string;
  pharmacyName: string;
  email: string;
  fullName: string;
  phone?: string;
  role?: string;
  password?: string;
  invitedByUserId: string;
  request: Request;
};

export async function invitePharmacyStaffMember(input: InvitePharmacyStaffInput) {
  const email = input.email.trim().toLowerCase();
  const password =
    typeof input.password === "string" && input.password.trim().length >= 6
      ? input.password.trim()
      : generateTemporaryPassword();

  const fullName =
    input.fullName.trim() ||
    email.split("@")[0]?.replace(/[._]/g, " ") ||
    "Team member";

  const role = input.role?.trim() || "staff";
  const pharmacyName = input.pharmacyName.trim() || "your pharmacy";

  await assertStaffInviteEmailAllowed(input.pharmacyId, email);

  let authUser: { user: { id: string } };
  try {
    authUser = await adminCreateAuthUser({
      email,
      password,
      fullName,
      userMetadata: staffInviteUserMetadata({
        full_name: fullName,
        phone: input.phone,
      }),
    });
  } catch (createUserError) {
    mapCreateUserErrorForStaffInvite(createUserError as never);
    throw createUserError;
  }

  if (!authUser?.user) {
    throw new Error("Failed to create team member");
  }

  await storeCreatePharmacyMembership({
    pharmacyId: input.pharmacyId,
    userId: authUser.user.id,
    role,
  });

  await writeAuditLog({
    pharmacyId: input.pharmacyId,
    userId: input.invitedByUserId,
    action: "INSERT",
    tableName: "pharmacy_users",
    recordId: authUser.user.id,
    newValues: {
      invitedUserId: authUser.user.id,
      email,
      fullName,
      role,
    },
    ...auditRequestMetadata(input.request),
  });

  const emailResult = await sendStaffInviteEmail({
    to: email,
    fullName,
    pharmacyName,
    role,
    temporaryPassword: password,
  });

  return buildStaffInviteApiPayload({
    email,
    temporaryPassword: password,
    emailResult,
    userId: authUser.user.id,
    messageWhenEmailOk: "Team member created and invitation email sent",
    messageWhenEmailFailed:
      "Team member created; invitation email could not be sent",
  });
}

export { StaffInviteEmailRejectedError };
