"use client";

import { MapPin, Phone, Mail, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export type PharmacyBrandPreviewProps = {
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  className?: string;
};

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "RX";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function hasContent(value?: string): value is string {
  return Boolean(value?.trim());
}

export function PharmacyBrandPreview({
  name,
  city,
  address,
  phone,
  email,
  licenseNumber,
  className,
}: PharmacyBrandPreviewProps) {
  const displayName = name.trim() || "Your Pharmacy";
  const initials = getInitials(name);
  const isPlaceholder = !name.trim();
  const locationLine = [city?.trim(), address?.trim()].filter(Boolean).join(" · ");

  return (
    <div className={cn("space-y-3 lg:sticky lg:top-8", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          Brand identity preview
        </p>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-medium text-neutral-600">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neutral-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neutral-900" />
          </span>
          Live
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 bg-neutral-50 px-5 py-5">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-lg font-semibold tracking-tight transition-colors duration-300",
                isPlaceholder
                  ? "border-dashed border-neutral-300 bg-white text-neutral-400"
                  : "border-neutral-900 bg-neutral-900 text-white shadow-sm",
              )}
              aria-hidden
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={cn(
                  "truncate text-lg font-semibold leading-tight transition-colors duration-300",
                  isPlaceholder ? "text-neutral-400" : "text-neutral-900",
                )}
              >
                {displayName}
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
                Digital healthcare partner
              </p>
              {locationLine ? (
                <p className="mt-2 flex items-start gap-1 text-xs text-neutral-600">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  <span className="line-clamp-2">{locationLine}</span>
                </p>
              ) : (
                <p className="mt-2 text-xs text-neutral-400">
                  City and address will show here
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 px-5 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Receipt header preview
          </p>
          <div className="space-y-2 rounded-lg border border-neutral-100 bg-neutral-50/80 p-3">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-neutral-900">
                {displayName}
              </span>
              <span className="shrink-0 text-neutral-400">INV-001</span>
            </div>
            {hasContent(licenseNumber) ? (
              <p className="text-[10px] text-neutral-500">
                Lic. {licenseNumber.trim()}
              </p>
            ) : (
              <p className="text-[10px] text-neutral-400">
                Registration number appears on official documents
              </p>
            )}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>Paracetamol 500mg</span>
                <span>2,500 RWF</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-1.5 text-[10px] font-medium text-neutral-900">
                <span>Total</span>
                <span>2,500 RWF</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasContent(phone) ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] text-neutral-600">
                <Phone className="h-3 w-3" />
                {phone.trim()}
              </span>
            ) : null}
            {hasContent(email) ? (
              <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[10px] text-neutral-600">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{email.trim()}</span>
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-neutral-700" />
            <p className="text-[10px] leading-snug text-neutral-600">
              Verified pharmacy on the Pryrox network
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-neutral-500">
        Updates as you type — used on receipts, invoices, and your dashboard.
      </p>
    </div>
  );
}
