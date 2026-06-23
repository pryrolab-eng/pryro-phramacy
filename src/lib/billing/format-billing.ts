import type { BadgeProps } from "@/components/ui/badge";

export function invoiceStatusVariant(
  status: string,
): BadgeProps["variant"] {
  if (status === "paid") return "default";
  if (status === "overdue") return "destructive";
  if (status === "void") return "secondary";
  return "outline";
}

export function subscriptionStatusClass(status: string) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    pending_payment: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    cancelled: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
    expired: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    past_due: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  };
  return map[status] ?? "bg-neutral-100 text-neutral-600";
}
