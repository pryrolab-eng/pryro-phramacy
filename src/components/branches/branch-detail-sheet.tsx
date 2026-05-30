"use client";

import Link from "next/link";
import { MapPin, Phone, Mail, Activity, AlertTriangle, CreditCard } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DashboardButton, DashboardProgressTrack } from "@/components/dashboard";
import type { SaasBranchWithUsage } from "@/lib/http/saas-branches";
import {
  usageBarClassName,
  usageBarTone,
  usagePct,
} from "@/lib/branches/branch-usage";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";

type Props = {
  branch: SaasBranchWithUsage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BranchDetailSheet({ branch, open, onOpenChange }: Props) {
  const usage = branch?.usage;
  const pct = usagePct(usage);
  const tone = usageBarTone(pct, usage?.is_blocked ?? false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 border-neutral-200/80 p-0 sm:max-w-md dark:border-neutral-800">
        <SheetHeader className="border-b border-neutral-100 px-6 py-5 text-left dark:border-neutral-800">
          <SheetTitle className="text-base font-semibold tracking-tight">
            {branch?.name ?? "Branch"}
          </SheetTitle>
          <SheetDescription>Location details and monthly transaction usage</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!branch ? (
            <p className="text-sm text-neutral-500">Select a branch.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant={branch.is_active ? "default" : "secondary"}>
                  {branch.is_active ? "Active" : "Inactive"}
                </Badge>
                {usage?.is_blocked ? (
                  <Badge variant="destructive">Sales blocked</Badge>
                ) : null}
              </div>

              <dl className="space-y-3 text-sm">
                {branch.address ? (
                  <div>
                    <dt className="text-xs text-neutral-500">Address</dt>
                    <dd className="mt-0.5 inline-flex gap-1.5 font-medium">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-neutral-400" />
                      {branch.address}
                    </dd>
                  </div>
                ) : null}
                {branch.phone ? (
                  <div>
                    <dt className="text-xs text-neutral-500">Phone</dt>
                    <dd className="mt-0.5 inline-flex gap-1.5 font-medium">
                      <Phone className="size-3.5 text-neutral-400" />
                      {branch.phone}
                    </dd>
                  </div>
                ) : null}
                {branch.email ? (
                  <div>
                    <dt className="text-xs text-neutral-500">Email</dt>
                    <dd className="mt-0.5 inline-flex gap-1.5 break-all font-medium">
                      <Mail className="size-3.5 shrink-0 text-neutral-400" />
                      {branch.email}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <Separator />

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  <Activity className="size-3.5" />
                  Billing cycle usage
                </p>
                {usage ? (
                  <div className="space-y-3 rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-800/30">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Transactions
                      </span>
                      <span className="font-semibold tabular-nums">
                        {usage.tx_count.toLocaleString()} /{" "}
                        {usage.tx_limit.toLocaleString()}
                      </span>
                    </div>
                    <DashboardProgressTrack
                      value={pct}
                      barClassName={usageBarClassName(tone)}
                    />
                    <p className="text-xs text-neutral-500">
                      {pct}% used · Resets{" "}
                      {new Date(usage.billing_cycle_end).toLocaleDateString()}
                    </p>
                    {usage.is_blocked ? (
                      <p className="flex items-start gap-1.5 text-xs font-medium text-red-600">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                        Limit reached. New POS sales are blocked until the cycle
                        resets or you upgrade.
                      </p>
                    ) : pct >= 80 ? (
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                        {usage.tx_limit - usage.tx_count} transactions remaining
                        this cycle.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500">
                    No usage record for the current billing cycle.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {branch && (usage?.is_blocked || !usage) && (
          <div className="border-t border-neutral-100 px-6 py-4 dark:border-neutral-800">
            <DashboardButton tone="primary" className="w-full" asChild>
              <Link href={PHARMACY_ROUTES.billing}>
                <CreditCard className="mr-1.5 h-4 w-4" />
                View billing & plans
              </Link>
            </DashboardButton>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
