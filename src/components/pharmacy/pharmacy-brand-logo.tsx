"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  logoUrl?: string | null;
  name: string;
  icon: LucideIcon;
  iconClassName?: string;
  className?: string;
  imageClassName?: string;
};

/** Pharmacy logo image or fallback icon — used in sidebar and shell. */
export function PharmacyBrandLogo({
  logoUrl,
  name,
  icon: Icon,
  iconClassName,
  className,
  imageClassName,
}: Props) {
  if (logoUrl?.trim()) {
    return (
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className={cn("object-contain", imageClassName ?? "h-8 w-auto max-w-[140px]")}
      />
    );
  }

  return (
    <Icon
      className={cn("size-4 shrink-0", iconClassName)}
      strokeWidth={1.75}
      aria-hidden
    />
  );
}
