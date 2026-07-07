import type { StaffUser } from "@/lib/http/staff";
import { fieldsMatchQuery } from "@/lib/search/match-text";

export function filterStaffForSearch(
  staff: StaffUser[],
  query: string,
): StaffUser[] {
  const q = query.trim();
  if (!q) return staff;
  return staff.filter((member) =>
    fieldsMatchQuery([member.name, member.email, member.phone, member.role], q),
  );
}
