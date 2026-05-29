"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogDescription,
  DashboardDialogBody,
  DashboardDialogActions,
  DashboardButton,
} from "@/components/dashboard";
import {
  useCashierShift,
  useCloseCashierShiftMutation,
  useOpenCashierShiftMutation,
} from "@/hooks/usePos";

type Props = {
  branchId: string | null;
};

export function PosShiftPanel({ branchId }: Props) {
  const shiftQuery = useCashierShift(branchId);
  const openMutation = useOpenCashierShiftMutation();
  const closeMutation = useCloseCashierShiftMutation();

  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [openingCash, setOpeningCash] = useState("0");
  const [actualCash, setActualCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  const shift = shiftQuery.data;

  const openShift = async () => {
    if (!branchId) return;
    try {
      await openMutation.mutateAsync({
        branchId,
        openingCash: parseFloat(openingCash) || 0,
      });
      setOpenDialog(false);
      void shiftQuery.refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not open shift");
    }
  };

  const closeShift = async () => {
    if (!branchId || !shift) return;
    try {
      const result = await closeMutation.mutateAsync({
        branchId,
        shiftId: shift.id,
        actualCash: parseFloat(actualCash) || 0,
        closeNotes: closeNotes || undefined,
      });
      const { summary } = result;
      alert(
        `Shift closed.\nExpected cash: ${summary.expectedCash.toLocaleString()} RWF\nActual: ${summary.actualCash.toLocaleString()} RWF\nVariance: ${summary.variance.toLocaleString()} RWF`,
      );
      setCloseDialog(false);
      void shiftQuery.refetch();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not close shift");
    }
  };

  if (!branchId) {
    return (
      <p className="text-xs text-neutral-500">Select a branch to manage shifts.</p>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-neutral-200/80 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Cashier shift
        </span>
        {shift ? (
          <Badge className="bg-emerald-600 hover:bg-emerald-600">Open</Badge>
        ) : (
          <Badge variant="secondary">Closed</Badge>
        )}
      </div>

      {shift ? (
        <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
          <p>Opened: {new Date(shift.opened_at).toLocaleTimeString()}</p>
          <p>Float: {Number(shift.opening_cash).toLocaleString()} RWF</p>
          <p>
            Sales (live):{" "}
            {Number(shift.liveTotalSales ?? shift.total_sales ?? 0).toLocaleString()}{" "}
            RWF
          </p>
          <p>
            Expected cash:{" "}
            {Number(
              shift.expected_cash ??
                Number(shift.opening_cash) + Number(shift.liveCashSales ?? 0),
            ).toLocaleString()}{" "}
            RWF
          </p>
        </div>
      ) : (
        <p className="text-xs text-neutral-500">
          Open a shift before cash sales to track your drawer.
        </p>
      )}

      <div className="flex gap-2">
        {!shift ? (
          <DashboardButton
            tone="primary"
            className="h-8 flex-1"
            onClick={() => setOpenDialog(true)}
          >
            Open shift
          </DashboardButton>
        ) : (
          <DashboardButton
            className="h-8 flex-1"
            onClick={() => {
              setActualCash(
                String(
                  shift.expected_cash ??
                    Number(shift.opening_cash) + Number(shift.liveCashSales ?? 0),
                ),
              );
              setCloseDialog(true);
            }}
          >
            Close shift
          </DashboardButton>
        )}
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DashboardDialogContent className="sm:max-w-sm">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Open cashier shift</DashboardDialogTitle>
            <DashboardDialogDescription>
              Count the cash in your drawer before the first sale.
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-3">
            <div className="space-y-1">
              <Label>Opening cash in drawer (RWF)</Label>
              <Input
                type="number"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
              />
            </div>
          </DashboardDialogBody>
          <DashboardDialogActions
            cancelLabel="Cancel"
            confirmLabel="Start shift"
            onCancel={() => setOpenDialog(false)}
            onConfirm={() => void openShift()}
            confirmLoading={openMutation.isPending}
          />
        </DashboardDialogContent>
      </Dialog>

      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DashboardDialogContent className="sm:max-w-sm">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Close cashier shift</DashboardDialogTitle>
            <DashboardDialogDescription>
              Expected cash:{" "}
              {Number(
                shift?.expected_cash ??
                  Number(shift?.opening_cash ?? 0) + Number(shift?.liveCashSales ?? 0),
              ).toLocaleString()}{" "}
              RWF
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-3">
            <div className="space-y-1">
              <Label>Actual cash counted (RWF)</Label>
              <Input
                type="number"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
              />
            </div>
            <Input
              placeholder="Notes (optional)"
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
            />
          </DashboardDialogBody>
          <DashboardDialogActions
            cancelLabel="Cancel"
            confirmLabel="Close shift"
            onCancel={() => setCloseDialog(false)}
            onConfirm={() => void closeShift()}
            confirmLoading={closeMutation.isPending}
          />
        </DashboardDialogContent>
      </Dialog>
    </div>
  );
}
