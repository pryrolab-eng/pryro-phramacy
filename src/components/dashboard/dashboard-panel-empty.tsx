import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type DashboardPanelEmptyProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
};

export function DashboardPanelEmpty({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: DashboardPanelEmptyProps) {
  return (
    <div
      className={cn(
        "flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 bg-white">
        <Icon className="h-5 w-5 text-neutral-500" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-medium text-neutral-900">{title}</p>
      <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-neutral-500">
        {description}
      </p>
      {actionLabel && actionHref ? (
        <Button
          asChild
          size="sm"
          className="mt-5 bg-neutral-900 text-white hover:bg-neutral-800"
        >
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
