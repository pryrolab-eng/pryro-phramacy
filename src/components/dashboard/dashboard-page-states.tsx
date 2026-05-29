import { DashboardButton } from "./dashboard-button";
import { DashboardPageShell } from "./dashboard-page-shell";
import { Spinner } from "@/components/ui/spinner";

export function DashboardPageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <DashboardPageShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-6" />
        <p className="text-sm text-neutral-500">{label}</p>
      </div>
    </DashboardPageShell>
  );
}

export function DashboardPageError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <DashboardPageShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
        {onRetry ? (
          <DashboardButton tone="primary" onClick={onRetry}>
            Try again
          </DashboardButton>
        ) : null}
      </div>
    </DashboardPageShell>
  );
}
