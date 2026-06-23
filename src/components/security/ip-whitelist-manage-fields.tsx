"use client";

import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DashboardButton } from "@/components/dashboard";
import {
  ALLOW_ALL_IPV4_CIDR,
  isAllowAllIpEntry,
} from "@/lib/security/ip-address";

export type IpWhitelistRow = {
  id: string;
  ip_address: string;
  description?: string | null;
};

type Props = {
  ips: IpWhitelistRow[];
  newIp: { ip: string; description: string };
  onNewIpChange: (value: { ip: string; description: string }) => void;
  onAdd: (body: { ip: string; description: string }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  addPending?: boolean;
  removePending?: boolean;
};

export function IpWhitelistManageFields({
  ips,
  newIp,
  onNewIpChange,
  onAdd,
  onRemove,
  addPending = false,
}: Props) {
  const hasAllowAll = ips.some((row) => isAllowAllIpEntry(row.ip_address));

  const handleAdd = async (ip: string, description: string) => {
    try {
      await onAdd({ ip, description });
      onNewIpChange({ ip: "", description: "" });
      toast.success(
        isAllowAllIpEntry(ip) ? "All IPs allowed (0.0.0.0/0)" : "IP added",
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add IP");
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="192.168.1.100 or 0.0.0.0/0"
          value={newIp.ip}
          onChange={(e) => onNewIpChange({ ...newIp, ip: e.target.value })}
        />
        <Input
          placeholder="Description"
          value={newIp.description}
          onChange={(e) =>
            onNewIpChange({ ...newIp, description: e.target.value })
          }
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <DashboardButton
          onClick={() => void handleAdd(newIp.ip, newIp.description)}
          disabled={!newIp.ip.trim() || addPending}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add IP
        </DashboardButton>
        <DashboardButton
          tone="outline"
          disabled={hasAllowAll || addPending}
          onClick={() =>
            void handleAdd(
              ALLOW_ALL_IPV4_CIDR,
              "Allow all IP addresses",
            )
          }
        >
          Allow all IPs (0.0.0.0/0)
        </DashboardButton>
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-neutral-200/80 p-3 dark:border-neutral-700">
        {ips.length === 0 ? (
          <p className="text-center text-sm text-neutral-500">
            No whitelisted IPs yet
          </p>
        ) : (
          ips.map((ip) => {
            const allowAll = isAllowAllIpEntry(ip.ip_address);
            return (
              <div
                key={ip.id}
                className="flex items-center justify-between rounded-lg border border-neutral-100 px-3 py-2 dark:border-neutral-800"
              >
                <div>
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {allowAll ? "All IP addresses" : ip.ip_address}
                    {allowAll ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {ALLOW_ALL_IPV4_CIDR}
                      </Badge>
                    ) : null}
                  </p>
                  {ip.description ? (
                    <p className="text-xs text-neutral-500">{ip.description}</p>
                  ) : null}
                </div>
                <DashboardButton
                  size="sm"
                  onClick={async () => {
                    try {
                      await onRemove(ip.id);
                      toast.success("IP removed");
                    } catch {
                      toast.error("Failed to remove IP");
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </DashboardButton>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
