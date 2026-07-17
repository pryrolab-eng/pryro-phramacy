"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { Badge, badgeVariantFromTone } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogBody,
  DashboardButton,
  DashboardListRow,
} from "@/components/dashboard";
import { invoiceStatusTone } from "@/lib/ui/status-tone";
import type { SubscriptionInvoice } from "@/lib/saas/types";

type Props = {
  invoice: SubscriptionInvoice;
};

export function BillingInvoiceRow({ invoice }: Props) {
  const [open, setOpen] = useState(false);
  const statusVariant = badgeVariantFromTone(invoiceStatusTone(invoice.status));

  return (
    <DashboardListRow className="items-center gap-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Receipt className="size-4 text-neutral-400" />
          <span className="text-sm font-medium">{invoice.invoice_number}</span>
          <Badge variant={statusVariant} className="h-5 text-[10px] capitalize">
            {invoice.status}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-neutral-500">
          {invoice.billing_month} · Due{" "}
          {new Date(invoice.due_date).toLocaleDateString()}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-semibold tabular-nums">
          RWF {Number(invoice.total).toLocaleString()}
        </span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <DashboardButton size="sm">View</DashboardButton>
          </DialogTrigger>
          <DashboardDialogContent className="sm:max-w-lg">
            <DashboardDialogHeader>
              <DashboardDialogTitle>
                Invoice {invoice.invoice_number}
              </DashboardDialogTitle>
            </DashboardDialogHeader>
            <DashboardDialogBody className="space-y-4">
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Billing month</dt>
                  <dd className="font-medium">{invoice.billing_month}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Due date</dt>
                  <dd className="font-medium">
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Status</dt>
                  <dd>
                    <Badge variant={statusVariant} className="capitalize">
                      {invoice.status}
                    </Badge>
                  </dd>
                </div>
              </dl>
              {invoice.lines && invoice.lines.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-neutral-200/80 dark:border-neutral-700">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                      <tr>
                        <th className="p-2 text-left font-medium">Description</th>
                        <th className="p-2 text-right font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lines.map((line) => (
                        <tr
                          key={line.id}
                          className="border-t border-neutral-100 dark:border-neutral-800"
                        >
                          <td className="p-2">{line.description}</td>
                          <td className="p-2 text-right tabular-nums">
                            RWF {Number(line.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t bg-neutral-50/80 dark:bg-neutral-800/30">
                      <tr>
                        <td className="p-2 font-semibold">Total</td>
                        <td className="p-2 text-right font-semibold tabular-nums">
                          RWF {Number(invoice.total).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : null}
            </DashboardDialogBody>
          </DashboardDialogContent>
        </Dialog>
      </div>
    </DashboardListRow>
  );
}
