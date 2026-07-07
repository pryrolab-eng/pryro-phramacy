"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  BookOpen,
  CreditCard,
  LogOut,
  MoreVertical,
  User,
} from "lucide-react";
import { SignOutConfirmDialog } from "@/components/auth/sign-out-confirm-dialog";
import { NavMenuShortcut } from "@/components/sidebar/nav-menu-shortcut";
import { isStaffWorkspaceRole } from "@/lib/rbac/pharmacy-roles";
import { cn } from "@/lib/utils";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useActivePharmacy } from "@/components/providers/active-pharmacy-provider";
import { useDashboardGraceNav } from "@/hooks/useDashboardGraceNav";
import { Spinner } from "@/components/ui/spinner";
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

type Props = {
  userName: string;
  roleLabel: string;
  avatarClassName?: string;
};

function MenuShortcut({ keys }: { keys: string[] }) {
  return <NavMenuShortcut keys={keys} />;
}

function MenuActionLink({
  href,
  icon: Icon,
  label,
  shortcut,
  onNavigate,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string[];
  onNavigate?: () => void;
}) {
  return (
    <DropdownMenuItem asChild className="p-0 focus:bg-accent">
      <Link
        href={href}
        onClick={onNavigate}
        className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm outline-none"
      >
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 font-medium text-foreground">{label}</span>
        {shortcut ? <MenuShortcut keys={shortcut} /> : null}
      </Link>
    </DropdownMenuItem>
  );
}

function MenuActionLocked({
  icon: Icon,
  label,
  shortcut,
  lockedHint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string[];
  lockedHint: string;
}) {
  return (
    <DropdownMenuItem
      disabled
      className="flex cursor-not-allowed items-center gap-3 rounded-md px-2.5 py-2 opacity-50"
      onSelect={(e) => e.preventDefault()}
      title={`Unavailable — ${lockedHint}`}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1 text-sm font-medium text-muted-foreground">
        {label}
      </span>
      {shortcut ? (
        <MenuShortcut keys={shortcut} />
      ) : (
        <span className="ml-auto max-w-[5.5rem] truncate text-[10px] text-muted-foreground">
          {lockedHint}
        </span>
      )}
    </DropdownMenuItem>
  );
}

function MenuNavAction({
  href,
  icon,
  label,
  shortcut,
  onNavigate,
  enabled,
  lockedHint,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string[];
  onNavigate?: () => void;
  enabled: boolean;
  lockedHint: string;
}) {
  if (!enabled) {
    return (
      <MenuActionLocked
        icon={icon}
        label={label}
        shortcut={shortcut}
        lockedHint={lockedHint}
      />
    );
  }
  return (
    <MenuActionLink
      href={href}
      icon={icon}
      label={label}
      shortcut={shortcut}
      onNavigate={onNavigate}
    />
  );
}

export function SidebarUserAccountMenu({
  userName,
  roleLabel,
  avatarClassName = "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400",
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const requestSignOut = () => {
    setOpen(false);
    setSignOutOpen(true);
  };
  const { context, switchPharmacy, isPending: contextLoading } = useActivePharmacy();
  const { canReachHref, lockedHint } = useDashboardGraceNav();

  const email = context.user.email ?? "";
  const memberships = context.memberships;
  const initial = userName ? userName.charAt(0).toUpperCase() : "U";

  const settingsHref = isStaffWorkspaceRole(context.role)
    ? PHARMACY_ROUTES.staffSettings
    : `${PHARMACY_ROUTES.settings}?tab=security`;
  const profileLabel = isStaffWorkspaceRole(context.role)
    ? "My settings"
    : "View profile";

  const handleSwitchPharmacy = async (pharmacyId: string) => {
    if (pharmacyId === context.activePharmacyId) return;
    setSwitchingId(pharmacyId);
    try {
      await switchPharmacy(pharmacyId);
      setOpen(false);
    } finally {
      setSwitchingId(null);
    }
  };

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") {
        if (!canReachHref(settingsHref)) return;
        e.preventDefault();
        setOpen(false);
        router.push(settingsHref);
        return;
      }
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        requestSignOut();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, router, canReachHref, settingsHref]);

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
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                avatarClassName,
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
                {roleLabel}
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
        side="right"
        align="end"
        sideOffset={8}
        className="w-[min(100vw-2rem,20rem)] rounded-xl border border-border/80 bg-popover p-1.5 shadow-lg"
      >
        <div className="py-0.5">
          <MenuNavAction
            href={PHARMACY_ROUTES.helpGettingStarted}
            icon={BookOpen}
            label="Help"
            enabled={canReachHref(PHARMACY_ROUTES.helpGettingStarted)}
            lockedHint={lockedHint}
            onNavigate={() => setOpen(false)}
          />
          <MenuNavAction
            href={settingsHref}
            icon={User}
            label={profileLabel}
            shortcut={["⌘", "S"]}
            enabled={canReachHref(settingsHref)}
            lockedHint={lockedHint}
            onNavigate={() => setOpen(false)}
          />
          {!isStaffWorkspaceRole(context.role) ? (
            <MenuNavAction
              href={PHARMACY_ROUTES.billing}
              icon={CreditCard}
              label="Billing & plans"
              enabled={canReachHref(PHARMACY_ROUTES.billing)}
              lockedHint={lockedHint}
              onNavigate={() => setOpen(false)}
            />
          ) : null}
        </div>

        <DropdownMenuSeparator className="my-1.5" />

        <DropdownMenuLabel className="px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {memberships.length > 1 ? "Switch pharmacy" : "Your pharmacy"}
        </DropdownMenuLabel>

        <div className="space-y-0.5 px-0.5 pb-0.5">
          {memberships.length > 0 ? (
            memberships.map((m) => (
              <button
                key={m.pharmacyId}
                type="button"
                disabled={Boolean(switchingId) || contextLoading}
                onClick={() => void handleSwitchPharmacy(m.pharmacyId)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted/80",
                  m.isActive && "bg-muted/50",
                  switchingId === m.pharmacyId && "opacity-70",
                )}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback
                      className={cn(
                        "text-xs font-semibold",
                        avatarClassName,
                      )}
                    >
                      {(m.pharmacyName ?? "P").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-popover bg-emerald-500"
                    aria-hidden
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {m.pharmacyName ?? "Pharmacy"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {email || roleLabel}
                  </p>
                </div>
                {switchingId === m.pharmacyId ? (
                  <Spinner className="h-4 w-4 shrink-0" />
                ) : (
                  <span
                    className={cn(
                      "h-4 w-4 shrink-0 rounded-full border-2",
                      m.isActive
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30 bg-transparent",
                    )}
                    aria-hidden={!m.isActive}
                  />
                )}
              </button>
            ))
          ) : (
            <div className="flex items-center gap-3 rounded-lg px-2.5 py-2">
              <div className="relative shrink-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={cn("text-xs font-semibold", avatarClassName)}>
                    <Building2 className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{userName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {email || roleLabel}
                </p>
              </div>
              <span className="h-4 w-4 shrink-0 rounded-full border-[5px] border-primary bg-primary" />
            </div>
          )}
        </div>

        <DropdownMenuSeparator className="my-1.5" />

        <DropdownMenuItem
          className="flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 focus:bg-accent"
          onSelect={(e) => {
            e.preventDefault();
            requestSignOut();
          }}
        >
          <LogOut className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 text-sm font-medium">Sign out</span>
          <MenuShortcut keys={["⌥", "⇧", "Q"]} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <SignOutConfirmDialog open={signOutOpen} onOpenChange={setSignOutOpen} />
    </>
  );
}
