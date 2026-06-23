"use client";

import { Building2, Users, Store } from "lucide-react";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import type { AdminGlobalSearchResult } from "@/lib/search/types";

type Props = {
  data: AdminGlobalSearchResult;
  onNavigate: (href: string) => void;
};

export function CommandPaletteAdminResults({ data, onNavigate }: Props) {
  const hasPharmacies = data.pharmacies.length > 0;
  const hasStaff = data.staff && data.staff.length > 0;
  const hasBranches = data.branches && data.branches.length > 0;

  if (!hasPharmacies && !hasStaff && !hasBranches) return null;

  return (
    <>
      {hasPharmacies && (
        <CommandGroup heading="Pharmacies">
          {data.pharmacies.map((p) => (
            <CommandItem
              key={`pharmacy-${p.id}`}
              value={`pharmacy-${p.id}`}
              keywords={[p.name, p.email ?? "", p.phone ?? "", "pharmacy store"]}
              onSelect={() =>
                onNavigate(
                  `/admin/stores?search=${encodeURIComponent(p.name)}`,
                )
              }
            >
              <Building2 className="mr-2 h-4 w-4 text-neutral-500" />
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              {p.email ? (
                <span className="ml-2 truncate text-xs text-muted-foreground">
                  {p.email}
                </span>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {hasStaff && (
        <CommandGroup heading="Staff Members">
          {data.staff.map((s) => (
            <CommandItem
              key={`staff-${s.id}`}
              value={`staff-${s.id}`}
              keywords={[s.name, s.email ?? "", s.role ?? "", s.pharmacyName, "staff member"]}
              onSelect={() =>
                onNavigate(
                  `/admin/stores?search=${encodeURIComponent(s.pharmacyName)}`,
                )
              }
            >
              <Users className="mr-2 h-4 w-4 text-neutral-500" />
              <span className="min-w-0 flex-1 truncate">{s.name}</span>
              <span className="ml-2 truncate text-xs text-muted-foreground font-medium">
                {s.role ? `${s.role} • ` : ""}{s.pharmacyName}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {hasBranches && (
        <CommandGroup heading="Branches">
          {data.branches.map((b) => (
            <CommandItem
              key={`branch-${b.id}`}
              value={`branch-${b.id}`}
              keywords={[b.name, b.city ?? "", b.status ?? "", b.pharmacyName, "branch"]}
              onSelect={() =>
                onNavigate(
                  `/admin/stores?search=${encodeURIComponent(b.pharmacyName)}`,
                )
              }
            >
              <Store className="mr-2 h-4 w-4 text-neutral-500" />
              <span className="min-w-0 flex-1 truncate">{b.name}</span>
              <span className="ml-2 truncate text-xs text-muted-foreground font-medium">
                {b.city ? `${b.city} • ` : ""}{b.pharmacyName}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </>
  );
}
