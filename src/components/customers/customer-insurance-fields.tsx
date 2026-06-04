"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInsuranceProviders } from "@/hooks/useInsuranceProviders";

export const CUSTOMER_INSURANCE_NONE = "__none__";

export function buildCustomerInsuranceValue(
  provider?: string | null,
  memberNumber?: string | null,
): string {
  const member = (memberNumber ?? "").trim();
  const rawProvider = (provider ?? "").trim();
  const providerName =
    rawProvider && rawProvider !== CUSTOMER_INSURANCE_NONE ? rawProvider : "";
  if (member) return member;
  return providerName;
}

export function splitCustomerInsuranceValue(
  stored: string | undefined | null,
  providerNames: string[],
): { provider: string; memberNumber: string } {
  const value = (stored ?? "").trim();
  if (!value) return { provider: "", memberNumber: "" };
  const match = providerNames.find(
    (name) => name.toLowerCase() === value.toLowerCase(),
  );
  if (match) return { provider: match, memberNumber: "" };
  return { provider: "", memberNumber: value };
}

type Props = {
  provider: string;
  memberNumber: string;
  onProviderChange: (provider: string) => void;
  onMemberNumberChange: (memberNumber: string) => void;
  providerLabel?: string;
  memberLabel?: string;
};

export function CustomerInsuranceFields({
  provider = "",
  memberNumber = "",
  onProviderChange,
  onMemberNumberChange,
  providerLabel = "Insurance provider",
  memberLabel = "Member / policy number",
}: Props) {
  const providersQuery = useInsuranceProviders();
  const loading = providersQuery.isPending;

  const options = useMemo(() => {
    const rows = providersQuery.data ?? [];
    return rows
      .map((row) => ({
        id: String(row.id),
        name: String(row.name ?? row.id).trim(),
      }))
      .filter((row) => row.name.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [providersQuery.data]);

  const selectValue =
    provider && provider !== CUSTOMER_INSURANCE_NONE
      ? provider
      : CUSTOMER_INSURANCE_NONE;

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="cust-insurance-provider">{providerLabel}</Label>
        <Select
          value={selectValue}
          onValueChange={(value) =>
            onProviderChange(value === CUSTOMER_INSURANCE_NONE ? "" : value)
          }
          disabled={loading}
        >
          <SelectTrigger id="cust-insurance-provider">
            <SelectValue
              placeholder={loading ? "Loading insurers…" : "Select insurance"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={CUSTOMER_INSURANCE_NONE}>No insurance</SelectItem>
            {options.map((option) => (
              <SelectItem key={option.id} value={option.name}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!loading && options.length === 0 ? (
          <p className="text-xs text-neutral-500">
            No insurers configured. Add providers under Insurance settings first.
          </p>
        ) : null}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="cust-insurance-member">{memberLabel}</Label>
        <Input
          id="cust-insurance-member"
          placeholder="Optional card or policy ID"
          value={memberNumber}
          onChange={(e) => onMemberNumberChange(e.target.value)}
        />
      </div>
    </>
  );
}
