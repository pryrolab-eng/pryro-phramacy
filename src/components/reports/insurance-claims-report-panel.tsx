"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Printer, RefreshCw, Check, X, Clock, Loader } from "lucide-react";
import {
  DashboardButton,
  DashboardFilterBar,
  DashboardFilterField,
  DashboardMetricGrid,
  DashboardPageLoading,
  DashboardPanelEmpty,
  DashboardSectionCard,
  DashboardStatCard,
  DashboardTableCard,
} from "@/components/dashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getInsuranceClaimsReport,
  insuranceReportsKey,
} from "@/lib/http/insurance-reports";
import {
  getInsuranceProviders,
  insuranceProvidersQueryKey,
  type UpdateClaimStatusInput,
} from "@/lib/http/insurance";
import { useUpdateClaimStatusMutation } from "@/hooks/useInsuranceProviders";
import { toast } from "sonner";

const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export function InsuranceClaimsReportPanel() {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [providerId, setProviderId] = useState<string>("all");
  const [expandedClaimId, setExpandedClaimId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const statusMutation = useUpdateClaimStatusMutation();

  const VALID_TRANSITIONS: Record<string, UpdateClaimStatusInput["status"][]> = {
    pending: ["processing", "approved", "rejected"],
    processing: ["approved", "rejected"],
    approved: [],
    rejected: ["pending"],
  };

  const handleStatusChange = async (
    claimId: string,
    currentStatus: string,
    newStatus: UpdateClaimStatusInput["status"],
  ) => {
    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) return;

    try {
      await statusMutation.mutateAsync({ claimId, status: newStatus });
      toast.success(`Claim ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const providersQuery = useQuery({
    queryKey: insuranceProvidersQueryKey,
    queryFn: getInsuranceProviders,
  });

  const reportQuery = useQuery({
    queryKey: insuranceReportsKey(
      parseInt(month, 10),
      parseInt(year, 10),
      providerId === "all" ? null : providerId,
    ),
    queryFn: () =>
      getInsuranceClaimsReport({
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        providerId: providerId === "all" ? null : providerId,
      }),
  });

  const providers = providersQuery.data ?? [];
  const report = reportQuery.data;
  const claims = report?.claims ?? [];

  const yearOptions = useMemo(() => {
    const y = now.getFullYear();
    return [y, y - 1, y - 2].map((v) => String(v));
  }, [now]);

  const handlePrint = () => {
    const node = printRef.current;
    if (!node) {
      window.print();
      return;
    }
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) {
      window.print();
      return;
    }
    const css = report?.renderedCss ?? "";
    const html = report?.renderedHtml ?? node.innerHTML;
    win.document.write(`
      <!DOCTYPE html><html><head>
        <title>Insurance report ${month}/${year}</title>
        <style>${css}</style>
      </head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  if (reportQuery.isPending && !report) {
    return <DashboardPageLoading label="Loading insurance report…" />;
  }

  return (
    <div className="space-y-6">
      <DashboardFilterBar description="Monthly insurer submission pack from recorded claims">
        <DashboardFilterField label="Month">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-8 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DashboardFilterField>
        <DashboardFilterField label="Year">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-8 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DashboardFilterField>
        <DashboardFilterField label="Insurer (print template)">
          <Select value={providerId} onValueChange={setProviderId}>
            <SelectTrigger className="h-8 rounded-lg">
              <SelectValue placeholder="All insurers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All insurers</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {String(p.name ?? p.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DashboardFilterField>
        <DashboardFilterField label=" ">
          <div className="flex gap-2">
            <DashboardButton
              variant="outline"
              onClick={() => reportQuery.refetch()}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </DashboardButton>
            <DashboardButton
              onClick={handlePrint}
              disabled={providerId === "all" && claims.length === 0}
            >
              <Printer className="h-4 w-4" />
              Print report
            </DashboardButton>
          </div>
        </DashboardFilterField>
      </DashboardFilterBar>

      {providerId === "all" ? (
        <p className="text-sm text-muted-foreground">
          Select a specific insurer to preview the admin-designed print template.
          The table below lists all claims for the month.
        </p>
      ) : report?.template ? (
        <p className="text-sm text-muted-foreground">
          Using template: <strong>{report.template.name}</strong>
        </p>
      ) : (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          No active template for this insurer — using the default layout. Create
          one under Admin → Insurance templates.
        </p>
      )}

      <DashboardMetricGrid>
        <DashboardStatCard
          label="Claims"
          icon={FileText}
          value={report?.summary.totalClaims ?? 0}
          hint={`${month}/${year}`}
        />
        <DashboardStatCard
          label="Insurer total"
          icon={FileText}
          value={`${(report?.summary.totalAmount ?? 0).toLocaleString()} RWF`}
          hint="Sum of insurer portions"
        />
        <DashboardStatCard
          label="Patient copay"
          icon={FileText}
          value={`${(report?.summary.totalPatientCopay ?? 0).toLocaleString()} RWF`}
          hint="Patient portions"
        />
      </DashboardMetricGrid>

      {providerId !== "all" && report?.renderedHtml ? (
        <DashboardSectionCard
          title="Print preview"
          description="Rendered from the insurer template"
        >
          <div
            ref={printRef}
            className="insurance-report-preview overflow-x-auto rounded-lg border bg-white p-6 text-black print:border-0"
          >
            {report.renderedCss ? (
              <style dangerouslySetInnerHTML={{ __html: report.renderedCss }} />
            ) : null}
            <div dangerouslySetInnerHTML={{ __html: report.renderedHtml }} />
          </div>
        </DashboardSectionCard>
      ) : null}

      <DashboardTableCard title="Claims detail">
        {claims.length === 0 ? (
          <DashboardPanelEmpty
            icon={FileText}
            title="No claims this month"
            description="Insurance claims appear when you complete insurance sales at POS or process insurance on an order."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Insurer</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Member ID</TableHead>
                <TableHead className="text-right">Insurer</TableHead>
                <TableHead className="text-right">Patient</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <Fragment key={claim.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() =>
                      setExpandedClaimId((id) =>
                        id === claim.id ? null : claim.id,
                      )
                    }
                  >
                    <TableCell>{claim.date}</TableCell>
                    <TableCell>{claim.insuranceType}</TableCell>
                    <TableCell className="font-medium">
                      {claim.patientName}
                      {claim.items.length > 0 ? (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({claim.items.length} lines)
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {claim.insuranceNumber ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {claim.totalClaim.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {claim.patientCopay.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant={
                            claim.status === "approved"
                              ? "default"
                              : claim.status === "rejected"
                                ? "destructive"
                                : claim.status === "processing"
                                  ? "secondary"
                                  : "outline"
                          }
                        >
                          {claim.status}
                        </Badge>
                        {(VALID_TRANSITIONS[claim.status] ?? []).length > 0 && (
                          <Select
                            value=""
                            onValueChange={(v) =>
                              handleStatusChange(
                                claim.id,
                                claim.status,
                                v as UpdateClaimStatusInput["status"],
                              )
                            }
                          >
                            <SelectTrigger className="h-6 w-auto border-0 bg-transparent p-0 text-xs text-muted-foreground hover:text-foreground [&>svg]:hidden">
                              <span className="px-1">···</span>
                            </SelectTrigger>
                            <SelectContent>
                              {(VALID_TRANSITIONS[claim.status] ?? []).map(
                                (s) => (
                                  <SelectItem key={s} value={s}>
                                    {s === "processing" && (
                                      <Clock className="mr-1 inline h-3 w-3" />
                                    )}
                                    {s === "approved" && (
                                      <Check className="mr-1 inline h-3 w-3 text-green-600" />
                                    )}
                                    {s === "rejected" && (
                                      <X className="mr-1 inline h-3 w-3 text-red-600" />
                                    )}
                                    {s === "pending" && (
                                      <Clock className="mr-1 inline h-3 w-3" />
                                    )}
                                    Mark {s}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedClaimId === claim.id && claim.items.length > 0 ? (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={7} className="p-0">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b text-muted-foreground">
                              <th className="p-2 text-left">Product</th>
                              <th className="p-2 text-left">Insurer code</th>
                              <th className="p-2 text-right">Qty</th>
                              <th className="p-2 text-right">Insurer</th>
                              <th className="p-2 text-right">Patient</th>
                            </tr>
                          </thead>
                          <tbody>
                            {claim.items.map((item, idx) => (
                              <tr key={idx} className="border-b border-muted/50">
                                <td className="p-2">{item.drug}</td>
                                <td className="p-2 text-muted-foreground">
                                  {item.externalCode ?? "—"}
                                </td>
                                <td className="p-2 text-right">{item.quantity}</td>
                                <td className="p-2 text-right">
                                  {item.insurancePays.toLocaleString()}
                                </td>
                                <td className="p-2 text-right">
                                  {item.patientPays.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </DashboardTableCard>
    </div>
  );
}
