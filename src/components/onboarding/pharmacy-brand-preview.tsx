"use client";

import { cn } from "@/lib/utils";
import { PharmacyReceiptPreview } from "@/components/pharmacy/pharmacy-receipt-preview";

export type PharmacyBrandPreviewProps = {
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  className?: string;
};

export function PharmacyBrandPreview({
  name,
  city,
  address,
  phone,
  email,
  licenseNumber,
  className,
}: PharmacyBrandPreviewProps) {
  const isPlaceholder = !name.trim();

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

      <PharmacyReceiptPreview
        profile={{ name, city, address, phone, email, licenseNumber }}
        receiptNumber="INV-001"
        lines={[{ name: "Paracetamol 500mg", lineTotal: 2500 }]}
        total={2500}
        isPlaceholder={isPlaceholder}
        showVerifiedBadge
      />

      <p className="text-center text-xs text-neutral-500">
        Updates as you type — used on receipts, invoices, and your dashboard.
      </p>
    </div>
  );
}
