import { cn } from "@/lib/utils";

type Props = {
  value: number;
  className?: string;
  barClassName?: string;
};

export function DashboardProgressTrack({ value, className, barClassName }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full bg-neutral-900 transition-all dark:bg-neutral-100", barClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
