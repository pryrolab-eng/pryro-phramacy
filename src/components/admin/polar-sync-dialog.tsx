"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export type PolarSyncPlanResult = {
  id: string;
  name: string;
  action?: string;
  error?: string;
};

type PolarSyncDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  error?: string | null;
  synced?: number;
  failed?: number;
  skipped?: number;
  results?: PolarSyncPlanResult[];
};

export function PolarSyncDialog({
  open,
  onOpenChange,
  loading,
  error,
  synced = 0,
  failed = 0,
  skipped = 0,
  results = [],
}: PolarSyncDialogProps) {
  const failures = results.filter((r) => r.error);
  const successes = results.filter(
    (r) =>
      (r.action === "created" ||
        r.action === "updated" ||
        r.action === "recreated") &&
      !r.error
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {loading ? "Syncing plans to Polar" : "Polar sync complete"}
          </DialogTitle>
          <DialogDescription>
            {loading
              ? "Creating or updating products in Polar for each paid plan. This may take a moment."
              : error
                ? error
                : `${synced} synced${skipped ? `, ${skipped} skipped (free)` : ""}${failed ? `, ${failed} failed` : ""}.`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Please wait…</p>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive text-sm py-2">
            <XCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-3 text-sm">
            {successes.length > 0 ? (
              <div>
                <p className="font-medium text-green-700 dark:text-green-400 mb-1">
                  Synced
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {successes.map((r) => (
                    <li key={r.id} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      {r.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {failures.length > 0 ? (
              <div>
                <p className="font-medium text-destructive mb-1">Failed</p>
                <ul className="space-y-2">
                  {failures.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2"
                    >
                      <span className="font-medium">{r.name}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.error}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {loading ? "Working…" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
