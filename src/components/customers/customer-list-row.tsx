"use client";

import { Mail, Phone, Shield, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardListRow } from "@/components/dashboard";
import { cn } from "@/lib/utils";
import type { CustomerRow } from "@/lib/http/customers";

type Props = {
  customer: CustomerRow;
  className?: string;
  onSelect?: (customer: CustomerRow) => void;
};

export function CustomerListRow({ customer, className, onSelect }: Props) {
  const isActive = customer.status !== "inactive";
  const insurance =
    customer.insurance || customer.insurance_number || null;
  const purchases = customer.totalPurchases ?? 0;

  const row = (
    <DashboardListRow
      className={cn(
        "items-start gap-4",
        onSelect &&
          "cursor-pointer transition-colors hover:border-neutral-300 hover:bg-neutral-50/80 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/40",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200/80 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
          <User
            className="size-5 text-neutral-600 dark:text-neutral-300"
            strokeWidth={1.75}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-neutral-900 dark:text-neutral-50">
              {customer.name}
            </p>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className="h-5 text-[10px] font-medium capitalize"
            >
              {customer.status ?? "active"}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
            {customer.phone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3" />
                {customer.phone}
              </span>
            ) : null}
            {customer.email ? (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3" />
                {customer.email}
              </span>
            ) : null}
            {insurance ? (
              <span className="inline-flex items-center gap-1">
                <Shield className="size-3" />
                {insurance}
              </span>
            ) : null}
          </div>
          {(customer.allergies || customer.dateOfBirth) && (
            <p className="mt-1.5 text-xs text-neutral-500">
              {customer.dateOfBirth
                ? `DOB ${customer.dateOfBirth}`
                : null}
              {customer.dateOfBirth && customer.allergies ? " · " : null}
              {customer.allergies
                ? `Allergies: ${customer.allergies}`
                : null}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
          {purchases > 0 ? `${purchases.toLocaleString()} RWF` : "—"}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">Lifetime spend</p>
        {customer.lastVisit ? (
          <p className="mt-1 text-xs text-neutral-500">
            Since {customer.lastVisit}
          </p>
        ) : null}
      </div>
    </DashboardListRow>
  );

  if (!onSelect) return row;

  return (
    <button
      type="button"
      className="w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
      onClick={() => onSelect(customer)}
    >
      {row}
    </button>
  );
}
