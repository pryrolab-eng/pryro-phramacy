"use client";

import { MapPin, Phone, Mail, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  hasReceiptText,
  pharmacyInitials,
  pharmacyLocationLine,
  type PharmacyReceiptLine,
  type PharmacyReceiptProfile,
} from "@/lib/pharmacy/receipt-preview";

export type PharmacyReceiptPreviewProps = {
  profile: PharmacyReceiptProfile;
  receiptNumber: string;
  lines: PharmacyReceiptLine[];
  total: number;
  customerName?: string;
  patientName?: string;
  cashierName?: string;
  paymentMethod?: string;
  insuranceCoverage?: number;
  patientAmount?: number;
  footerText?: string;
  showVerifiedBadge?: boolean;
  isPlaceholder?: boolean;
  className?: string;
};

export function PharmacyReceiptPreview({
  profile,
  receiptNumber,
  lines,
  total,
  customerName,
  patientName,
  cashierName,
  paymentMethod,
  insuranceCoverage = 0,
  patientAmount,
  footerText,
  showVerifiedBadge = false,
  isPlaceholder = false,
  className,
}: PharmacyReceiptPreviewProps) {
  const displayName = profile.name.trim() || "Your Pharmacy";
  const initials = pharmacyInitials(profile.name);
  const locationLine = pharmacyLocationLine(profile);
  const amountDue = patientAmount ?? total;
  const showInsurance = insuranceCoverage > 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950",
        className,
      )}
      id="pharmacy-receipt-preview"
    >
      <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-5 dark:border-neutral-800 dark:bg-neutral-900/60">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-lg font-semibold tracking-tight",
              isPlaceholder
                ? "border-dashed border-neutral-300 bg-white text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900"
                : "border-neutral-900 bg-neutral-900 text-white shadow-sm dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900",
            )}
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p
              className={cn(
                "truncate text-lg font-semibold leading-tight",
                isPlaceholder
                  ? "text-neutral-400"
                  : "text-neutral-900 dark:text-neutral-50",
              )}
            >
              {displayName}
            </p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
              Digital healthcare partner
            </p>
            {locationLine ? (
              <p className="mt-2 flex items-start gap-1 text-xs text-neutral-600 dark:text-neutral-400">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                <span className="line-clamp-2">{locationLine}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-3 px-5 py-4">
        <div className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-medium text-neutral-900 dark:text-neutral-50">
              {displayName}
            </span>
            <span className="shrink-0 tabular-nums text-neutral-500">
              {receiptNumber}
            </span>
          </div>
          {hasReceiptText(profile.licenseNumber) ? (
            <p className="text-[10px] text-neutral-500">
              Lic. {profile.licenseNumber.trim()}
            </p>
          ) : null}
          {customerName ? (
            <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
              Payer: {customerName}
            </p>
          ) : null}
          {patientName?.trim() ? (
            <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
              Patient: {patientName.trim()}
            </p>
          ) : null}
          {cashierName ? (
            <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
              Cashier: {cashierName}
            </p>
          ) : null}
          {paymentMethod ? (
            <p className="text-[10px] text-neutral-600 dark:text-neutral-400">
              Payment: {paymentMethod.toUpperCase()}
            </p>
          ) : null}

          <div className="space-y-1.5 pt-1">
            {lines.map((line, index) => (
              <div
                key={`${line.name}-${index}`}
                className="flex justify-between gap-2 text-[10px] text-neutral-500"
              >
                <span className="min-w-0 truncate">
                  {line.quantity && line.quantity > 1
                    ? `${line.name} × ${line.quantity}`
                    : line.name}
                </span>
                <span className="shrink-0 tabular-nums">
                  {line.lineTotal.toLocaleString()} RWF
                </span>
              </div>
            ))}
            {showInsurance ? (
              <>
                <div className="flex justify-between text-[10px] text-emerald-700 dark:text-emerald-400">
                  <span>Insurance</span>
                  <span className="tabular-nums">
                    −{insuranceCoverage.toLocaleString()} RWF
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-neutral-600 dark:text-neutral-400">
                  <span>Patient pays</span>
                  <span className="tabular-nums">
                    {amountDue.toLocaleString()} RWF
                  </span>
                </div>
              </>
            ) : null}
            <div className="flex justify-between border-t border-neutral-200 pt-1.5 text-[10px] font-medium text-neutral-900 dark:border-neutral-700 dark:text-neutral-50">
              <span>Total</span>
              <span className="tabular-nums">{amountDue.toLocaleString()} RWF</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasReceiptText(profile.phone) ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
              <Phone className="h-3 w-3" />
              {profile.phone.trim()}
            </span>
          ) : null}
          {hasReceiptText(profile.email) ? (
            <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
              <Mail className="h-3 w-3 shrink-0" />
              <span className="truncate">{profile.email.trim()}</span>
            </span>
          ) : null}
        </div>

        {showVerifiedBadge ? (
          <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/50">
            <ShieldCheck className="h-4 w-4 shrink-0 text-neutral-700 dark:text-neutral-300" />
            <p className="text-[10px] leading-snug text-neutral-600 dark:text-neutral-400">
              Verified pharmacy on the Pryrox network
            </p>
          </div>
        ) : null}

        {footerText ? (
          <p className="text-center text-[10px] text-neutral-500">{footerText}</p>
        ) : null}
      </div>
    </div>
  );
}
