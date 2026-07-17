"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  PackageMinus,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DashboardButton } from "@/components/dashboard";
import type { PosProduct } from "@/hooks/usePos";
import { cn } from "@/lib/utils";
import {
  statusToneBadgeClass,
  statusToneBarClass,
  statusToneSurfaceClass,
  statusToneTextClass,
  type StatusTone,
} from "@/lib/ui/status-tone";
import {
  POS_EXPIRY_ALERT_DAYS,
  POS_LOW_STOCK_THRESHOLD,
  formatPosExpiryAlertLabel,
} from "@/components/pos/pos-tokens";

type PosAlertsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: PosProduct[];
  /** Focus catalog search on this product name and close the sheet. */
  onSelectProduct?: (productName: string) => void;
};

function expiryTone(days: number): StatusTone {
  if (days < 0 || days <= 30) return "danger";
  if (days <= 60) return "warning";
  return "info";
}

function stockTone(stock: number): StatusTone {
  return stock <= 0 ? "danger" : "caution";
}

function exportAlertsCsv(products: PosProduct[]) {
  const alerts = products.filter(
    (p) =>
      p.stock <= POS_LOW_STOCK_THRESHOLD ||
      p.daysToExpiry <= POS_EXPIRY_ALERT_DAYS,
  );
  const headers = [
    "Name",
    "Category",
    "Generic Name",
    "Strength",
    "Dosage Form",
    "Batch",
    "Barcode",
    "Stock",
    "Price",
    "Expiry Date",
    "Days Left",
    "Requires Prescription",
    "Status",
  ];
  const rows = alerts.map((p) => [
    p.name,
    p.category ?? "",
    p.genericName ?? "",
    p.strength ?? "",
    p.dosageForm ?? "",
    p.batch,
    p.barcode ?? "",
    p.stock,
    p.price,
    p.expiryDate ?? "",
    p.daysToExpiry >= 9999 ? "N/A" : p.daysToExpiry,
    p.requiresPrescription ? "Yes" : "No",
    p.stock <= POS_LOW_STOCK_THRESHOLD &&
    p.daysToExpiry <= POS_EXPIRY_ALERT_DAYS
      ? "Low Stock & Expiring"
      : p.stock <= POS_LOW_STOCK_THRESHOLD
        ? "Low Stock"
        : "Expiring",
  ]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `product-alerts-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${alerts.length} product(s)`);
}

function AlertRow({
  tone,
  title,
  detail,
  badge,
  onClick,
}: {
  tone: StatusTone;
  title: string;
  detail: string;
  badge: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full gap-3 overflow-hidden rounded-lg border px-3 py-2.5 text-left transition-colors",
        statusToneSurfaceClass[tone],
        onClick && "cursor-pointer hover:brightness-[0.98] active:scale-[0.99]",
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          statusToneBarClass[tone],
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1 pl-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
            {title}
          </p>
          <Badge
            className={cn(
              "shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold",
              statusToneBadgeClass[tone],
            )}
          >
            {badge}
          </Badge>
        </div>
        <p className={cn("mt-0.5 text-xs font-medium", statusToneTextClass[tone])}>
          {detail}
        </p>
      </div>
    </button>
  );
}

export function PosAlertsSheet({
  open,
  onOpenChange,
  products,
  onSelectProduct,
}: PosAlertsSheetProps) {
  const lowStock = useMemo(
    () =>
      products
        .filter((p) => p.stock <= POS_LOW_STOCK_THRESHOLD)
        .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name)),
    [products],
  );

  const expiring = useMemo(
    () =>
      products
        .filter((p) => p.daysToExpiry <= POS_EXPIRY_ALERT_DAYS)
        .sort(
          (a, b) =>
            a.daysToExpiry - b.daysToExpiry || a.name.localeCompare(b.name),
        ),
    [products],
  );

  const totalCount = useMemo(() => {
    const ids = new Set<string>();
    for (const p of lowStock) ids.add(p.id);
    for (const p of expiring) ids.add(p.id);
    return ids.size;
  }, [lowStock, expiring]);

  const criticalExpiry = expiring.filter((p) => p.daysToExpiry <= 30).length;

  const select = (name: string) => {
    onSelectProduct?.(name);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showClose={false}
        overlayClassName="bg-black/40"
        className="flex w-full flex-col gap-0 border-neutral-200/80 p-0 sm:max-w-md dark:border-neutral-800"
      >
        <SheetHeader className="space-y-3 border-b border-neutral-100 px-5 py-4 text-left dark:border-neutral-800">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <SheetTitle className="text-base font-semibold tracking-tight">
                  Alerts
                </SheetTitle>
                {totalCount > 0 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-md px-1.5 py-0 text-[11px] tabular-nums"
                  >
                    {totalCount}
                  </Badge>
                ) : null}
              </div>
              <SheetDescription className="text-xs text-neutral-500">
                {totalCount === 0
                  ? "Stock and expiry look clear for this branch."
                  : criticalExpiry > 0
                    ? `${criticalExpiry} item${criticalExpiry === 1 ? "" : "s"} expire within 30 days — act first.`
                    : "Low stock and near-expiry items that need attention."}
              </SheetDescription>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <DashboardButton
                tone="outline"
                size="sm"
                className="h-8 gap-1.5 px-2.5 text-xs"
                disabled={totalCount === 0}
                onClick={() => exportAlertsCsv(products)}
              >
                <Download className="size-3.5" />
                Excel
              </DashboardButton>
              <DashboardButton
                tone="outline"
                size="icon"
                className="size-8"
                onClick={() => onOpenChange(false)}
                aria-label="Close alerts"
              >
                ×
              </DashboardButton>
            </div>
          </div>

          {totalCount > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <div
                className={cn(
                  "rounded-lg border px-3 py-2",
                  lowStock.length > 0
                    ? statusToneSurfaceClass.caution
                    : "border-neutral-200/80 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/40",
                )}
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                  Low stock
                </p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                  {lowStock.length}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-lg border px-3 py-2",
                  expiring.length > 0
                    ? statusToneSurfaceClass.warning
                    : "border-neutral-200/80 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/40",
                )}
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                  Expiring
                </p>
                <p className="mt-0.5 text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                  {expiring.length}
                </p>
              </div>
            </div>
          ) : null}
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4">
          {lowStock.length > 0 ? (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <PackageMinus className="size-3.5 text-orange-600 dark:text-orange-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">
                  Low stock
                </h3>
                <span className="text-[11px] tabular-nums text-neutral-400">
                  {lowStock.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {lowStock.map((product) => {
                  const tone = stockTone(product.stock);
                  return (
                    <AlertRow
                      key={`stock-${product.id}`}
                      tone={tone}
                      title={product.name}
                      detail={
                        product.stock <= 0
                          ? "Out of stock"
                          : `${product.stock} unit${product.stock === 1 ? "" : "s"} left`
                      }
                      badge={product.stock <= 0 ? "Out" : "Low"}
                      onClick={
                        onSelectProduct
                          ? () => select(product.name)
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </section>
          ) : null}

          {expiring.length > 0 ? (
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Timer className="size-3.5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Expiring
                </h3>
                <span className="text-[11px] tabular-nums text-neutral-400">
                  {expiring.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {expiring.map((product) => {
                  const tone = expiryTone(product.daysToExpiry);
                  const label = formatPosExpiryAlertLabel(product.daysToExpiry);
                  return (
                    <AlertRow
                      key={`expiry-${product.id}`}
                      tone={tone}
                      title={product.name}
                      detail={label}
                      badge={
                        product.daysToExpiry < 0
                          ? "Expired"
                          : product.daysToExpiry <= 30
                            ? "Urgent"
                            : product.daysToExpiry <= 60
                              ? "Soon"
                              : "Watch"
                      }
                      onClick={
                        onSelectProduct
                          ? () => select(product.name)
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </section>
          ) : null}

          {totalCount === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-200/80 bg-emerald-50/40 px-4 py-12 text-center dark:border-emerald-900/50 dark:bg-emerald-950/20">
              <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                No alerts right now
              </p>
              <p className="max-w-[16rem] text-xs text-emerald-700/80 dark:text-emerald-300/80">
                Nothing is at or below {POS_LOW_STOCK_THRESHOLD} units or
                expiring within {POS_EXPIRY_ALERT_DAYS} days.
              </p>
            </div>
          ) : null}
        </div>

        {totalCount > 0 && onSelectProduct ? (
          <div className="border-t border-neutral-100 px-5 py-3 text-[11px] text-neutral-500 dark:border-neutral-800">
            Tap a product to find it in the catalog.
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
