import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dashboardButtonClass, dashboardSurfaces } from "./dashboard-tokens";

export type DashboardButtonTone = "outline" | "primary" | "ghost" | "destructive";

type DashboardButtonProps = ButtonProps & {
  tone?: DashboardButtonTone;
};

/** Dashboard action button — use instead of raw `Button` on dashboard surfaces. */
export const DashboardButton = React.forwardRef<
  HTMLButtonElement,
  DashboardButtonProps
>(function DashboardButton(
  { tone = "outline", className, size = "sm", ...props },
  ref,
) {
  const toneClass =
    tone === "primary"
      ? dashboardButtonClass.primary
      : tone === "ghost"
        ? dashboardButtonClass.ghost
        : tone === "destructive"
          ? dashboardButtonClass.destructive
          : dashboardButtonClass.outline;

  const variant =
    tone === "primary" || tone === "destructive"
      ? "default"
      : tone === "ghost"
        ? "ghost"
        : "outline";

  return (
    <Button
      ref={ref}
      size={size}
      variant={variant}
      className={cn(toneClass, className)}
      {...props}
    />
  );
});
DashboardButton.displayName = "DashboardButton";

/** Groups header / toolbar actions (Export, New sale, etc.). */
export function DashboardToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(dashboardSurfaces.toolbar, className)}>{children}</div>
  );
}

/** @deprecated Use `DashboardButton` */
export const DashboardHeaderButton = DashboardButton;

/** @deprecated Use `DashboardToolbar` */
export const DashboardHeaderActions = DashboardToolbar;
