"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, MoreVertical, Settings, Shield, KeyRound } from "lucide-react";
import { ChangePasswordDialog } from "@/components/auth/change-password-dialog";
import { SignOutConfirmDialog } from "@/components/auth/sign-out-confirm-dialog";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { dashboardSidebarTokens } from "@/components/sidebar/dashboard-sidebar-tokens";

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-border/70 bg-muted/60 px-1 font-mono text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

export function AdminSidebarUserMenu({ userName }: { userName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const requestSignOut = () => {
    setOpen(false);
    setSignOutOpen(true);
  };
  const initial = userName ? userName.charAt(0).toUpperCase() : "A";

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(false);
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        requestSignOut();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, router]);

  return (
    <>
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          tooltip={userName}
          className={cn(
            "h-12 w-full justify-between p-2",
            dashboardSidebarTokens.footerUser,
            "group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center",
          )}
        >
          <div className="flex min-w-0 items-center gap-2.5 group-data-[collapsible=icon]:gap-0">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                "bg-primary text-primary-foreground",
              )}
            >
              {initial}
            </div>
            <div
              className={cn(
                "grid min-w-0 flex-1 text-left text-sm leading-tight",
                dashboardSidebarTokens.collapsedHidden,
              )}
            >
              <span className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-50">
                {userName}
              </span>
              <span className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                Platform admin
              </span>
            </div>
          </div>
          <MoreVertical
            className={cn(
              "size-4 shrink-0 text-neutral-400",
              dashboardSidebarTokens.collapsedHidden,
            )}
          />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className={dashboardSidebarTokens.sidebarPopover}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{userName}</span>
            <span className="text-xs text-muted-foreground">Platform admin</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-3 px-2.5 py-2"
          onSelect={() => {
            setOpen(false);
            setChangePasswordOpen(true);
          }}
        >
          <KeyRound className="size-4 text-muted-foreground" />
          <span className="flex-1 font-medium">Change password</span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="p-0 focus:bg-accent">
          <Link
            href="/admin/settings"
            className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm"
            onClick={() => setOpen(false)}
          >
            <Settings className="size-4 text-muted-foreground" />
            <span className="flex-1 font-medium">Platform settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-3 px-2.5 py-2"
          onSelect={() => {
            setOpen(false);
            router.push("/admin");
          }}
        >
          <Shield className="size-4 text-muted-foreground" />
          <span className="flex-1 font-medium">Admin dashboard</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-3 px-2.5 py-2 text-destructive focus:text-destructive"
          onSelect={(e) => {
            e.preventDefault();
            requestSignOut();
          }}
        >
          <LogOut className="size-4" />
          <span className="flex-1 font-medium">Sign out</span>
          <span className="ml-auto flex gap-0.5">
            <Kbd>Alt</Kbd>
            <Kbd>⇧</Kbd>
            <Kbd>Q</Kbd>
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <ChangePasswordDialog
      open={changePasswordOpen}
      onOpenChange={setChangePasswordOpen}
    />
    <SignOutConfirmDialog
      open={signOutOpen}
      onOpenChange={setSignOutOpen}
      variant="admin"
    />
    </>
  );
}
