import type { StaffUser } from "@/lib/http/staff";

export function formatStaffRole(role: string) {
  const r = role?.toLowerCase() ?? "staff";
  if (r === "pharmacist") return "Pharmacist";
  if (r === "cashier") return "Cashier";
  if (r === "owner" || r === "pharmacy_owner") return "Owner";
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Staff";
}

export function staffStats(members: StaffUser[]) {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const active = members.filter((m) => m.status !== "inactive").length;
  const pharmacists = members.filter(
    (m) => m.role?.toLowerCase() === "pharmacist",
  ).length;
  const cashiers = members.filter(
    (m) => m.role?.toLowerCase() === "cashier",
  ).length;

  const joinedThisMonth = members.filter((m) => {
    if (!m.joinDate) return false;
    const d = new Date(m.joinDate);
    return !Number.isNaN(d.getTime()) && d >= monthStart;
  }).length;

  return {
    total: members.length,
    active,
    pharmacists,
    cashiers,
    joinedThisMonth,
  };
}
