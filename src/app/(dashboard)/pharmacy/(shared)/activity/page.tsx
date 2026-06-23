"use client";

import { useActivityLogs } from "@/hooks/useActivityLogs";
import {
  DashboardPageHeader,
  DashboardPageShell,
  DashboardSectionCard,
  DashboardListRow,
  DashboardPanelEmpty,
} from "@/components/dashboard";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { FeatureGate } from "@/components/subscription/feature-gate";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";
import { ApiError } from "@/lib/http/client";

function actionVariant(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action === "DELETE") return "destructive";
  if (action === "INSERT") return "default";
  return "secondary";
}

export default function ActivityPage() {
  const logsQuery = useActivityLogs();
  const items = logsQuery.data?.items ?? [];
  const auditLogsDisabled =
    logsQuery.error instanceof ApiError &&
    logsQuery.error.status === 403 &&
    logsQuery.error.message === "audit_logs_disabled";

  return (
    <FeatureGate featureKey="reports.view">
      <DashboardPageShell>
        <DashboardPageHeader
          title="Activity log"
          description="Recent changes in your pharmacy — sales, inventory, staff, and more."
        />

        <DashboardSectionCard
          title="Recent events"
          description="Populated from database audit triggers. Older history depends on retention."
        >
          {logsQuery.isPending ? (
            <div className="flex justify-center py-12">
              <Spinner className="size-6" />
            </div>
          ) : auditLogsDisabled ? (
            <DashboardPanelEmpty
              icon={History}
              title="Activity logging is disabled"
              description="Audit logs have been turned off by the platform administrator."
            />
          ) : items.length === 0 ? (
            <DashboardPanelEmpty
              icon={History}
              title="No activity yet"
              description="Changes to sales, inventory, and staff will appear here."
            />
          ) : (
            <ScrollArea className="h-[min(70vh,640px)]">
              <ul className="space-y-3 pr-4">
                {items.map((log) => (
                  <li key={log.id}>
                    <DashboardListRow className="flex-wrap items-start gap-2">
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium">{log.summary}</p>
                        <p className="text-xs text-neutral-500">
                          {log.userLabel}
                          {log.tableName ? ` · ${log.tableName}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant={actionVariant(log.action)}>{log.action}</Badge>
                        <span className="whitespace-nowrap text-xs text-neutral-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </DashboardListRow>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </DashboardSectionCard>
      </DashboardPageShell>
    </FeatureGate>
  );
}
