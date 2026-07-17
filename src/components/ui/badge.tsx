import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import {
  statusToneBadgeClass,
  type StatusTone,
} from "@/lib/ui/status-tone"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Semantic status — prefer these when the label is a status
        success: statusToneBadgeClass.success,
        warning: statusToneBadgeClass.warning,
        caution: statusToneBadgeClass.caution,
        danger: statusToneBadgeClass.danger,
        info: statusToneBadgeClass.info,
        muted: statusToneBadgeClass.muted,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

/** Map a status tone to a Badge variant (1:1 for semantic tones). */
export function badgeVariantFromTone(
  tone: StatusTone,
): NonNullable<BadgeProps["variant"]> {
  return tone
}

export { Badge, badgeVariants }
