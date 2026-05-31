/**
 * Pharmacy tenant roles and RBAC helpers.
 * Platform `admin` / `superadmin` are separate (platform console).
 */

export const PHARMACY_MEMBER_ROLES = [
  "pharmacy_owner",
  "pharmacist",
  "cashier",
  "staff",
] as const;

export type PharmacyMemberRole = (typeof PHARMACY_MEMBER_ROLES)[number];

/** Roles owners can assign when inviting team members. */
export const INVITEABLE_STAFF_ROLES = ["pharmacist", "cashier", "staff"] as const;

export type InviteableStaffRole = (typeof INVITEABLE_STAFF_ROLES)[number];

export function isPharmacyOwnerRole(role: string | null | undefined): boolean {
  return (
    role === "pharmacy_owner" ||
    role === "admin" ||
    role === "superadmin"
  );
}

/** Non-owner team members sharing one workspace shell (dashboard + staff settings). */
export function isStaffWorkspaceRole(role: string | null | undefined): boolean {
  return role === "pharmacist" || role === "cashier" || role === "staff";
}

export function formatPharmacyRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case "pharmacy_owner":
      return "Owner";
    case "pharmacist":
      return "Pharmacist";
    case "cashier":
      return "Cashier";
    case "staff":
      return "Staff";
    case "admin":
    case "superadmin":
      return "Administrator";
    default:
      return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Member";
  }
}
