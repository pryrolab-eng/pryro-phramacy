"use client";

import {
  Building2,
  FileText,
  Package,
  Receipt,
  UserCog,
  Users,
} from "lucide-react";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { PHARMACY_ROUTES } from "@/lib/routes/pharmacy-paths";
import type { PharmacyGlobalSearchResult } from "@/lib/search/types";

type Props = {
  data: PharmacyGlobalSearchResult;
  onNavigate: (href: string) => void;
};

export function CommandPalettePharmacyResults({ data, onNavigate }: Props) {
  const hasAny =
    data.customers.length > 0 ||
    data.products.length > 0 ||
    data.prescriptions.length > 0 ||
    data.sales.length > 0 ||
    data.staff.length > 0 ||
    data.branches.length > 0;

  if (!hasAny) return null;

  return (
    <>
      {data.customers.length > 0 ? (
        <CommandGroup heading="Customers">
          {data.customers.map((c) => (
            <CommandItem
              key={`customer-${c.id}`}
              value={`customer-${c.id}`}
              keywords={[c.name, c.phone ?? "", "customer"]}
              onSelect={() =>
                onNavigate(`${PHARMACY_ROUTES.pos}?customerId=${c.id}`)
              }
            >
              <Users className="mr-2 h-4 w-4 text-neutral-500" />
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              {c.phone ? (
                <span className="ml-2 truncate text-xs text-muted-foreground">
                  {c.phone}
                </span>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}

      {data.products.length > 0 ? (
        <CommandGroup heading="Products">
          {data.products.map((p) => (
            <CommandItem
              key={`product-${p.medicationId}`}
              value={`product-${p.medicationId}`}
              keywords={[p.name, p.category ?? "", "product inventory"]}
              onSelect={() => onNavigate(PHARMACY_ROUTES.inventory)}
            >
              <Package className="mr-2 h-4 w-4 text-neutral-500" />
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              {p.category ? (
                <span className="ml-2 truncate text-xs text-muted-foreground">
                  {p.category}
                </span>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}

      {data.prescriptions.length > 0 ? (
        <CommandGroup heading="Prescriptions">
          {data.prescriptions.map((p) => (
            <CommandItem
              key={`rx-${p.id}`}
              value={`rx-${p.id}`}
              keywords={[p.patient, p.doctor ?? "", "prescription"]}
              onSelect={() => onNavigate(PHARMACY_ROUTES.prescriptions)}
            >
              <FileText className="mr-2 h-4 w-4 text-neutral-500" />
              <span className="min-w-0 flex-1 truncate">{p.patient}</span>
              {p.doctor ? (
                <span className="ml-2 truncate text-xs text-muted-foreground">
                  {p.doctor}
                </span>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}

      {data.sales.length > 0 ? (
        <CommandGroup heading="Sales">
          {data.sales.map((s) => (
            <CommandItem
              key={`sale-${s.id}`}
              value={`sale-${s.id}`}
              keywords={[
                s.receiptNumber,
                s.customerName ?? "",
                "sale receipt",
              ]}
              onSelect={() =>
                onNavigate(
                  `${PHARMACY_ROUTES.sales}?receipt=${encodeURIComponent(s.receiptNumber)}`,
                )
              }
            >
              <Receipt className="mr-2 h-4 w-4 text-neutral-500" />
              <span className="min-w-0 flex-1 truncate">
                {s.receiptNumber}
              </span>
              {s.customerName ? (
                <span className="ml-2 truncate text-xs text-muted-foreground">
                  {s.customerName}
                </span>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}

      {data.staff.length > 0 ? (
        <CommandGroup heading="Staff">
          {data.staff.map((s) => (
            <CommandItem
              key={`staff-${s.id}`}
              value={`staff-${s.id}`}
              keywords={[s.name, s.email ?? "", s.role ?? "", "staff"]}
              onSelect={() => onNavigate(PHARMACY_ROUTES.staff)}
            >
              <UserCog className="mr-2 h-4 w-4 text-neutral-500" />
              <span className="min-w-0 flex-1 truncate">{s.name}</span>
              {s.role ? (
                <span className="ml-2 truncate text-xs text-muted-foreground">
                  {s.role}
                </span>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}

      {data.branches.length > 0 ? (
        <CommandGroup heading="Branches">
          {data.branches.map((b) => (
            <CommandItem
              key={`branch-${b.id}`}
              value={`branch-${b.id}`}
              keywords={[b.name, b.city ?? "", b.status ?? "", "branch"]}
              onSelect={() => onNavigate(PHARMACY_ROUTES.branches)}
            >
              <Building2 className="mr-2 h-4 w-4 text-neutral-500" />
              <span className="min-w-0 flex-1 truncate">{b.name}</span>
              {b.city ? (
                <span className="ml-2 truncate text-xs text-muted-foreground">
                  {b.city}
                </span>
              ) : null}
            </CommandItem>
          ))}
        </CommandGroup>
      ) : null}
    </>
  );
}
