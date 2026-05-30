"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminSettings } from "@/components/admin/settings/admin-settings-provider";

export function AdminSettingsFeedback() {
  const { error, success } = useAdminSettings();

  if (!error && !success) return null;

  return (
    <div className="space-y-3">
      {error ? (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-800",
            "dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200",
          )}
          role="alert"
        >
          <XCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      {success ? (
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-800",
            "dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200",
          )}
          role="status"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      ) : null}
    </div>
  );
}
