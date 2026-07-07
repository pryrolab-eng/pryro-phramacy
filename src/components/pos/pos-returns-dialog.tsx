"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogBody,
  DashboardDialogFooter,
  DashboardButton,
  DashboardSearchInput,
  dashboardSurfaces,
} from "@/components/dashboard";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  useCashierShift,
  useLookupPosSaleMutation,
  useProcessPosReturnMutation,
  type PosSaleLookup,
} from "@/hooks/usePos";
import type { ReturnDisposition } from "@/lib/pos/return-disposition";
import {
  defaultDispositionForReason,
  dispositionLabel,
  isDispositionAllowed,
} from "@/lib/pos/return-disposition";

type LineState = {
  saleItemId: string;
  inventoryId: string;
  name: string;
  maxQty: number;
  unitPrice: number;
  returnQty: number;
  disposition: ReturnDisposition;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string | null;
};

export function PosReturnsDialog({ open, onOpenChange, branchId }: Props) {
  const lookupMutation = useLookupPosSaleMutation();
  const returnMutation = useProcessPosReturnMutation();
  const shiftQuery = useCashierShift(branchId);
  const hasOpenShift = Boolean(shiftQuery.data);

  const [receipt, setReceipt] = useState("");
  const [sale, setSale] = useState<PosSaleLookup | null>(null);
  const [lines, setLines] = useState<LineState[]>([]);
  const [returnType, setReturnType] = useState<"return" | "refund" | "exchange">(
    "return",
  );
  const [reason, setReason] = useState("customer");
  const [notes, setNotes] = useState("");
  const [refundMethod, setRefundMethod] = useState("cash");
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReceipt("");
      setSale(null);
      setLines([]);
      setLookupError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!sale) return;
    setLines(
      sale.items
        .filter((i) => i.quantityAvailable > 0)
        .map((i) => ({
          saleItemId: i.saleItemId,
          inventoryId: i.inventoryId ?? "",
          name: i.name,
          maxQty: i.quantityAvailable,
          unitPrice: i.unitPrice,
          returnQty: 0,
          disposition: defaultDispositionForReason(reason),
        })),
    );
  }, [sale, reason]);

  const lookupSale = async () => {
    if (!branchId || !receipt.trim()) return;
    setLookupError(null);
    try {
      const result = await lookupMutation.mutateAsync({
        receipt: receipt.trim(),
        branchId,
      });
      setSale(result);
    } catch (e) {
      setSale(null);
      setLookupError(e instanceof Error ? e.message : "Sale not found");
    }
  };

  const refundTotal = lines.reduce(
    (s, l) => s + l.returnQty * l.unitPrice,
    0,
  );

  const submit = async () => {
    if (!branchId || !sale) return;

    if (!hasOpenShift) {
      toast.error("Open your cashier shift before processing a return.");
      return;
    }

    const items = lines
      .filter((l) => l.returnQty > 0 && l.inventoryId)
      .map((l) => ({
        saleItemId: l.saleItemId,
        inventoryId: l.inventoryId,
        quantity: l.returnQty,
        disposition: l.disposition,
      }));

    if (items.length === 0) {
      toast.error("Select at least one item to return.");
      return;
    }

    for (const item of items) {
      if (!isDispositionAllowed(reason, item.disposition)) {
        toast.error(
          `Cannot use "${dispositionLabel(item.disposition)}" for reason "${reason}".`,
        );
        return;
      }
    }

    try {
      const result = await returnMutation.mutateAsync({
        saleId: sale.id,
        branchId,
        returnType,
        reason,
        notes: notes || undefined,
        refundMethod,
        refundAmount: refundTotal,
        items,
      });
      toast.success("Return processed", {
        description: `Refund ${(result.refundAmount ?? refundTotal).toLocaleString()} RWF`,
      });
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Return failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DashboardDialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DashboardDialogHeader>
          <DashboardDialogTitle>Returns &amp; refunds</DashboardDialogTitle>
        </DashboardDialogHeader>

        <DashboardDialogBody className="space-y-4">
          {branchId && !shiftQuery.isLoading && !hasOpenShift ? (
            <p className="rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
              Open your cashier shift on POS before processing returns.
            </p>
          ) : null}
          <div className="flex gap-2">
            <DashboardSearchInput
              placeholder="Receipt number (e.g. RCP-…)"
              value={receipt}
              onChange={(e) => setReceipt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void lookupSale()}
              className="flex-1"
            />
            <DashboardButton
              type="button"
              tone="primary"
              onClick={() => void lookupSale()}
              disabled={!branchId || lookupMutation.isPending}
            >
              {lookupMutation.isPending ? (
                <Spinner className="size-4" />
              ) : (
                "Find sale"
              )}
            </DashboardButton>
          </div>

          {lookupError ? (
            <p className="text-sm text-destructive">{lookupError}</p>
          ) : null}

          {sale ? (
            <>
              <div className={cn(dashboardSurfaces.listRow, "flex-col items-stretch space-y-1 text-sm")}>
                <p>
                  <span className="font-medium">Receipt:</span>{" "}
                  {sale.receiptNumber}
                </p>
                <p>
                  <span className="font-medium">Customer:</span>{" "}
                  {sale.customerName ?? "Walk-in"}
                </p>
                <p>
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(sale.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Return type</Label>
                  <Select
                    value={returnType}
                    onValueChange={(v) =>
                      setReturnType(v as typeof returnType)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="return">Return</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="exchange">Exchange</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Reason</Label>
                  <Select value={reason} onValueChange={setReason}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer request</SelectItem>
                      <SelectItem value="wrong">Wrong item</SelectItem>
                      <SelectItem value="defective">Defective</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Items</Label>
                {lines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No returnable items on this sale.
                  </p>
                ) : (
                  lines.map((line, idx) => (
                    <div
                      key={line.saleItemId}
                      className={cn(dashboardSurfaces.listRow, "flex-col items-stretch space-y-2")}
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-sm">{line.name}</span>
                        <Badge variant="outline" className="text-xs">
                          max {line.maxQty}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min={0}
                            max={line.maxQty}
                            value={line.returnQty || ""}
                            onChange={(e) => {
                              const returnQty = Math.min(
                                line.maxQty,
                                Math.max(0, Number(e.target.value) || 0),
                              );
                              setLines((prev) =>
                                prev.map((l, i) =>
                                  i === idx ? { ...l, returnQty } : l,
                                ),
                              );
                            }}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Disposition</Label>
                          <Select
                            value={line.disposition}
                            onValueChange={(v) => {
                              const disposition = v as ReturnDisposition;
                              setLines((prev) =>
                                prev.map((l, i) =>
                                  i === idx ? { ...l, disposition } : l,
                                ),
                              );
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem
                                value="restock"
                                disabled={!isDispositionAllowed(reason, "restock")}
                              >
                                Restock
                              </SelectItem>
                              <SelectItem value="damaged">Damaged</SelectItem>
                              <SelectItem value="destroy">Destroy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {dispositionLabel(line.disposition)}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <Input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Refund method</Label>
                  <Select value={refundMethod} onValueChange={setRefundMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mobile_money">Mobile money</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Refund total</Label>
                  <Input
                    value={refundTotal.toLocaleString()}
                    disabled
                    className="font-semibold"
                  />
                </div>
              </div>

              <DashboardDialogFooter>
                <DashboardButton className="flex-1" onClick={() => onOpenChange(false)}>
                  Cancel
                </DashboardButton>
                <DashboardButton
                  tone="primary"
                  className="flex-1"
                  disabled={
                    returnMutation.isPending ||
                    refundTotal <= 0 ||
                    !hasOpenShift
                  }
                  onClick={() => void submit()}
                >
                  {returnMutation.isPending ? "Processing…" : "Process return"}
                </DashboardButton>
              </DashboardDialogFooter>
            </>
          ) : null}
        </DashboardDialogBody>
      </DashboardDialogContent>
    </Dialog>
  );
}
