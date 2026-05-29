"use client";

import { Mail, Phone, Calendar, UserCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardListRow } from "@/components/dashboard";
import { cn } from "@/lib/utils";
import type { StaffUser } from "@/lib/http/staff";
import { formatStaffRole } from "@/lib/staff/format-staff";

type Props = {
  member: StaffUser;
  className?: string;
  onSelect?: (member: StaffUser) => void;
};

export function StaffListRow({ member, className, onSelect }: Props) {
  const isActive = member.status !== "inactive";

  const row = (
    <DashboardListRow
      className={cn(
        "items-start gap-4",
        onSelect &&
          "cursor-pointer transition-colors hover:border-neutral-300 hover:bg-neutral-50/80 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/40",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200/80 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50">
          <UserCog
            className="size-5 text-neutral-600 dark:text-neutral-300"
            strokeWidth={1.75}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-neutral-900 dark:text-neutral-50">
              {member.name}
            </p>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className="h-5 text-[10px] font-medium capitalize"
            >
              {member.status ?? "active"}
            </Badge>
            <Badge variant="outline" className="h-5 text-[10px] font-medium">
              {formatStaffRole(member.role)}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
            {member.email ? (
              <span className="inline-flex items-center gap-1">
                <Mail className="size-3" />
                <span className="truncate max-w-[200px]">{member.email}</span>
              </span>
            ) : null}
            {member.phone && member.phone !== "N/A" ? (
              <span className="inline-flex items-center gap-1">
                <Phone className="size-3" />
                {member.phone}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="shrink-0 text-right">
        {member.joinDate ? (
          <>
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
              {member.joinDate}
            </p>
            <p className="mt-0.5 inline-flex items-center justify-end gap-1 text-xs text-neutral-500">
              <Calendar className="size-3" />
              Joined
            </p>
          </>
        ) : (
          <p className="text-xs text-neutral-500">—</p>
        )}
      </div>
    </DashboardListRow>
  );

  if (!onSelect) return row;

  return (
    <button
      type="button"
      className="w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
      onClick={() => onSelect(member)}
    >
      {row}
    </button>
  );
}
