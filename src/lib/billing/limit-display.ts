import {
  statusToneBarClass,
  statusToneTextClass,
  usageTone,
} from "@/lib/ui/status-tone";

export function isAtLimit(current: number, max: number): boolean {
  return max > 0 && current >= max;
}

export function limitUsagePct(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, (current / max) * 100);
}

export function limitUsageTextClass(atLimit: boolean): string {
  return atLimit
    ? `font-semibold ${statusToneTextClass.danger}`
    : "text-muted-foreground";
}

export function limitUsageBarClass(atLimit: boolean): string {
  return atLimit ? statusToneBarClass.danger : "bg-neutral-900 dark:bg-neutral-100";
}

export function limitUsageBorderClass(atLimit: boolean): string | undefined {
  return atLimit ? "border-red-200/80 dark:border-red-900/50" : undefined;
}

export function limitUsageTone(current: number, max: number) {
  return usageTone(limitUsagePct(current, max), isAtLimit(current, max));
}
