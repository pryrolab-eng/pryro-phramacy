"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  INTEGRATION_V1_ASSIGNABLE_PERMISSIONS,
  INTEGRATION_V1_PERMISSIONS,
} from "@/lib/integrations/v1/constants";

const SCOPE_LABELS: Record<string, string> = {
  [INTEGRATION_V1_PERMISSIONS.pharmaciesRead]: "Pharmacies (read)",
  [INTEGRATION_V1_PERMISSIONS.inventoryRead]: "Inventory (read)",
  [INTEGRATION_V1_PERMISSIONS.salesRead]: "Sales (read)",
  [INTEGRATION_V1_PERMISSIONS.webhooksManage]: "Webhooks (manage)",
  [INTEGRATION_V1_PERMISSIONS.all]: "All scopes (*)",
};

const SCOPED_PERMISSIONS = INTEGRATION_V1_ASSIGNABLE_PERMISSIONS.filter(
  (scope) => scope !== INTEGRATION_V1_PERMISSIONS.all,
);

export function formatIntegrationKeyPermissions(
  permissions: string[] | null | undefined,
): string {
  if (!permissions?.length) return "Full access";
  if (permissions.includes("*")) return "All scopes";
  return permissions.join(", ");
}

type PlatformApiKeyPermissionsFieldsProps = {
  permissions: string[];
  onChange: (permissions: string[]) => void;
};

export function PlatformApiKeyPermissionsFields({
  permissions,
  onChange,
}: PlatformApiKeyPermissionsFieldsProps) {
  const fullAccess = permissions.length === 0;
  const allScopes = permissions.includes("*");

  const toggleFullAccess = (checked: boolean) => {
    onChange(checked ? [] : [INTEGRATION_V1_PERMISSIONS.pharmaciesRead]);
  };

  const toggleAllScopes = (checked: boolean) => {
    onChange(checked ? ["*"] : [INTEGRATION_V1_PERMISSIONS.pharmaciesRead]);
  };

  const toggleScope = (scope: string, checked: boolean) => {
    const withoutWildcard = permissions.filter((p) => p !== "*");
    const next = checked
      ? [...withoutWildcard, scope]
      : withoutWildcard.filter((p) => p !== scope);
    onChange(next.length ? next : []);
  };

  return (
    <div className="grid gap-3">
      <Label>API scopes</Label>
      <p className="text-xs text-muted-foreground">
        Leave as full access for unrestricted v1 endpoints, or restrict to specific
        read scopes.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={fullAccess} onCheckedChange={toggleFullAccess} />
        Full access (no scope restriction)
      </label>
      {!fullAccess ? (
        <div className="ml-1 grid gap-2 border-l pl-3">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={allScopes} onCheckedChange={toggleAllScopes} />
            {SCOPE_LABELS[INTEGRATION_V1_PERMISSIONS.all]}
          </label>
          {!allScopes
            ? SCOPED_PERMISSIONS.map((scope) => (
                <label key={scope} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={permissions.includes(scope)}
                    onCheckedChange={(checked) =>
                      toggleScope(scope, checked === true)
                    }
                  />
                  {SCOPE_LABELS[scope] ?? scope}
                </label>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
