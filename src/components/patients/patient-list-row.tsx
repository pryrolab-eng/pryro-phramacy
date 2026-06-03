"use client";

import { CalendarDays, HeartPulse, Mail, Phone, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardListRow } from "@/components/dashboard";
import { cn } from "@/lib/utils";
import type { CustomerRow } from "@/lib/http/customers";

type Props = {
  patient: CustomerRow;
  className?: string;
  onSelect?: (patient: CustomerRow) => void;
};

function formatLastVisit(value?: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PatientListRow({ patient, className, onSelect }: Props) {
  const isActive = patient.status !== "inactive";
  const insurance =
    patient.insurance || patient.insurance_number || null;
  const lastVisit = formatLastVisit(patient.lastVisit);

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
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-violet-200/80 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/40">
          <HeartPulse
            className="size-5 text-violet-700 dark:text-violet-300"
            strokeWidth={1.75}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-neutral-900 dark:text-neutral-50">
              {patient.name}
            </p>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className="h-5 text-[10px] font-medium capitalize"
            >
              {patient.status ?? "active"}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
            {patient.phone ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3" />
                {patient.phone}
              </span>
            ) : null}
            {patient.email ? (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3" />
                {patient.email}
              </span>
            ) : null}
            {insurance ? (
              <span className="inline-flex items-center gap-1">
                <Shield className="size-3" />
                {insurance}
              </span>
            ) : null}
          </div>
          {(patient.dateOfBirth || patient.allergies) && (
            <p className="mt-1.5 text-xs text-neutral-500">
              {patient.dateOfBirth ? `DOB ${patient.dateOfBirth}` : null}
              {patient.dateOfBirth && patient.allergies ? " · " : null}
              {patient.allergies
                ? `Allergies: ${patient.allergies}`
                : null}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        {lastVisit ? (
          <>
            <p className="inline-flex items-center justify-end gap-1 text-sm font-medium text-neutral-900 dark:text-neutral-50">
              <CalendarDays className="size-3.5 text-neutral-400" />
              {lastVisit}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500">Last visit</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-neutral-400">—</p>
            <p className="mt-0.5 text-xs text-neutral-500">No visits yet</p>
          </>
        )}
      </div>
    </DashboardListRow>
  );

  if (!onSelect) return row;

  return (
    <button
      type="button"
      className="w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
      onClick={() => onSelect(patient)}
    >
      {row}
    </button>
  );
}
