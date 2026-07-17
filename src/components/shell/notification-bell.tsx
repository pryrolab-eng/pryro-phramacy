"use client";

import { Bell } from "lucide-react";
import { useNotificationStream } from "@/hooks/useNotificationStream";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { statusToneBarClass } from "@/lib/ui/status-tone";

export function NotificationBell() {
  const { notifications, unreadCount, connected, markRead } =
    useNotificationStream();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative shrink-0"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
          <span
            className={cn(
              "absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full",
              connected ? statusToneBarClass.success : "bg-muted-foreground/40",
            )}
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>No notifications yet</DropdownMenuItem>
        ) : (
          notifications.slice(0, 8).map((item) => (
            <DropdownMenuItem
              key={item.id}
              className="flex flex-col items-start gap-1"
              onSelect={() => {
                if (!item.read) void markRead(item.id);
              }}
            >
              <span className="font-medium">{item.title}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">
                {item.message}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
