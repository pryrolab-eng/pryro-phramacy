"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DashboardButton,
  DashboardDialogContent,
  DashboardDialogHeader,
  DashboardDialogTitle,
  DashboardDialogDescription,
  DashboardDialogBody,
  DashboardDialogActions,
} from "@/components/dashboard";
import {
  useCashierShift,
  useCloseCashierShiftMutation,
  useOpenCashierShiftMutation,
  useTeamOpenCashierShifts,
} from "@/hooks/usePos";
import { cn } from "@/lib/utils";

type Props = {
  branchId: string | null;
  /** When true, show who else has an open shift (pharmacy owner). */
  showTeamShifts?: boolean;
  /** Block sales until the current user opens a shift. */
  shiftRequired?: boolean;
  /** Mount dialogs in this element (full-window POS layer above z-100). */
  dialogContainer?: HTMLElement | null;
};

export function PosShiftPanel({
  branchId,
  showTeamShifts = false,
  shiftRequired = true,
  dialogContainer,
}: Props) {
  const shiftQuery = useCashierShift(branchId);
  const teamQuery = useTeamOpenCashierShifts(branchId, showTeamShifts);
  const openMutation = useOpenCashierShiftMutation();
  const closeMutation = useCloseCashierShiftMutation();

  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [openingCash, setOpeningCash] = useState("0");
  const [actualCash, setActualCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  const shift = shiftQuery.data;
  const shiftOpen = Boolean(shift);
  const busy = openMutation.isPending || closeMutation.isPending;

  const expectedCash = Number(
    shift?.expected_cash ??
      Number(shift?.opening_cash ?? 0) + Number(shift?.liveCashSales ?? 0),
  );

  const beginOpenShift = () => {
    if (busy || !branchId) return;
    setOpeningCash("0");
    setOpenDialog(true);
  };

  const beginCloseShift = () => {
    if (busy || !shift) return;
    setActualCash(String(expectedCash));
    setCloseNotes("");
    setCloseDialog(true);
  };

  const openShift = async () => {
    if (!branchId) return;
    try {
      await openMutation.mutateAsync({
        branchId,
        openingCash: parseFloat(openingCash) || 0,
      });
      setOpenDialog(false);
      toast.success("Shift opened");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not open shift");
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
      toast.success("Shift closed", {
        description: `Expected ${summary.expectedCash.toLocaleString()} RWF · Actual ${summary.actualCash.toLocaleString()} RWF · Variance ${summary.variance.toLocaleString()} RWF`,
        duration: 8000,
      });
      setCloseDialog(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not close shift");
    }
  };

  if (!branchId) {
    return (
      <p className="text-xs text-neutral-500">Select a branch to manage shifts.</p>
    );
  }

  return (
    <div
      className={cn(
        "rounded-md px-2 py-1.5",
        shiftRequired && !shift
          ? "border border-amber-300/80 bg-amber-50/90 dark:border-amber-800 dark:bg-amber-950/30"
          : "border border-neutral-200/80 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-900/40",
      )}
    >
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200">
            Cashier shift
            <span className="ml-1.5 font-normal text-neutral-500">
              {shiftQuery.isLoading ? "…" : shiftOpen ? "Open" : "Closed"}
            </span>
          </p>
        </div>
        {shiftOpen ? (
          <DashboardButton
            size="sm"
            className="h-7 shrink-0 px-2 text-xs"
            disabled={busy || shiftQuery.isLoading}
            onClick={beginCloseShift}
          >
            Close shift
          </DashboardButton>
        ) : (
          <DashboardButton
            tone="primary"
            size="sm"
            className="h-7 shrink-0 px-2 text-xs"
            disabled={busy || shiftQuery.isLoading}
            onClick={beginOpenShift}
          >
            Open shift
          </DashboardButton>
        )}
      </div>

      {shift ? (
        <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] leading-snug text-neutral-600 dark:text-neutral-400">
          <p>Opened: {new Date(shift.opened_at).toLocaleTimeString()}</p>
          <p>Float: {Number(shift.opening_cash).toLocaleString()} RWF</p>
          <p>
            Sales:{" "}
            {Number(shift.liveTotalSales ?? shift.total_sales ?? 0).toLocaleString()}{" "}
            RWF
          </p>
          <p>Cash: {expectedCash.toLocaleString()} RWF</p>
        </div>
      ) : null}

      {showTeamShifts && (teamQuery.data ?? []).length > 0 ? (
        <div className="mt-1.5 rounded-md border border-neutral-200/60 bg-white/60 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900/50">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
            On duty
          </p>
          <ul className="mt-0.5 space-y-0.5">
            {(teamQuery.data ?? []).map((member) => (
              <li
                key={member.id}
                className="text-xs text-neutral-700 dark:text-neutral-300"
              >
                <span className="font-medium">{member.cashierName}</span>
                {member.isCurrentUser ? " (you)" : ""}
                <span className="text-neutral-500">
                  {" "}
                  ·{" "}
                  {new Date(member.openedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DashboardDialogContent className="sm:max-w-sm" portalContainer={dialogContainer}>
          <DashboardDialogHeader>
            <DashboardDialogTitle>Open shift</DashboardDialogTitle>
            <DashboardDialogDescription>
              Enter the opening float, then start the shift.
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="pos-opening-cash">Opening cash (RWF)</Label>
              <Input
                id="pos-opening-cash"
                type="number"
                min={0}
                step="1"
                autoFocus
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void openShift();
                  }
                }}
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
        <DashboardDialogContent className="sm:max-w-sm" portalContainer={dialogContainer}>
          <DashboardDialogHeader>
            <DashboardDialogTitle>Close shift</DashboardDialogTitle>
            <DashboardDialogDescription>
              Expected cash in drawer: {expectedCash.toLocaleString()} RWF
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="pos-actual-cash">Actual cash (RWF)</Label>
              <Input
                id="pos-actual-cash"
                type="number"
                min={0}
                step="1"
                autoFocus
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void closeShift();
                  }
                }}
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
