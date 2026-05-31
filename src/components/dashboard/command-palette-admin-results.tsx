"use client";

import { Building2 } from "lucide-react";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import type { AdminGlobalSearchResult } from "@/lib/search/types";

type Props = {
  data: AdminGlobalSearchResult;
  onNavigate: (href: string) => void;
};

export function CommandPaletteAdminResults({ data, onNavigate }: Props) {
  if (data.pharmacies.length === 0) return null;

  return (
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
  );
}
