"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export function SettingsPanelTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 pb-6 dark:border-neutral-800">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function SettingsSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
          {title}
        </h2>
        {description ? (
          <p className="text-xs text-neutral-500">{description}</p>
        ) : null}
      </div>
      <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200/80 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900/60">
        {children}
      </div>
    </section>
  );
}

export function SettingsRow({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
          {title}
        </p>
        {description ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
        {children}
      </div>
    </div>
  );
}

export function SettingsCheckboxGroup({
  title,
  linkLabel,
  onLinkClick,
  options,
}: {
  title: string;
  linkLabel?: string;
  onLinkClick?: () => void;
  options: Array<{
    id: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }>;
}) {
  return (
    <div className="space-y-3 px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
          {title}
        </p>
        {linkLabel && onLinkClick ? (
          <button
            type="button"
            onClick={onLinkClick}
            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {linkLabel}
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {options.map((opt) => (
          <label
            key={opt.id}
            className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"
          >
            <input
              type="checkbox"
              checked={opt.checked}
              onChange={(e) => opt.onChange(e.target.checked)}
              className="size-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export function SettingsPanelDivider() {
  return <Separator className="my-8" />;
}
