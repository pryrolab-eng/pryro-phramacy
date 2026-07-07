"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Database, FileSpreadsheet, FlaskConical, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  DashboardPageHeader,
  DashboardButton,
  DashboardSectionCard,
} from "@/components/dashboard";
import {
  downloadImportTemplate,
  IMPORT_TEMPLATES,
  importTemplateHref,
  type ImportTemplateId,
} from "@/lib/import/templates";
import { seedPharmacyDemoData } from "@/lib/http/pharmacy-demo-seed";
import { PHARMACY_ROUTES, inventoryInsuranceHref } from "@/lib/routes/pharmacy-paths";

const DEMO_IMPORT_FILES = [
  {
    label: "RSSB formulary (fuzzy names)",
    href: "/demo/demo-rssb-formulary-fuzzy.xlsx",
    note: "Upload on Insurance → Medicines to test match review",
  },
  {
    label: "Extra inventory products",
    href: "/demo/demo-inventory-new-products.xlsx",
    note: "2 products not in the base seed — test inventory import",
  },
  {
    label: "Sample customers",
    href: "/demo/demo-customers.xlsx",
    note: "Test customer batch import",
  },
] as const;

const isDev = process.env.NODE_ENV === "development";

export function PharmacyImportDataPanel() {
  const handleDownload = async (id: ImportTemplateId) => {
    await downloadImportTemplate(id);
  };

  const seedDemo = useMutation({
    mutationFn: seedPharmacyDemoData,
    onSuccess: (result) => {
      toast.success("Demo data loaded", {
        description: `${result.inventory.created} products, ${result.customers.created} customers, insurer ${result.insuranceProvider.name}`,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <>
      <DashboardPageHeader
        title="Import your data"
        description="Download a Pryrox Excel template, fill it with your existing records, then upload in one batch. Each template includes an Instructions sheet."
        actions={
          <DashboardButton tone="outline" asChild>
            <Link href={PHARMACY_ROUTES.helpGettingStarted}>
              How the system works
            </Link>
          </DashboardButton>
        }
      />

      <DashboardSectionCard
        title="Try with demo data"
        description="Load a starter catalog into your pharmacy, then use the sample insurer file to practice fuzzy matching."
        className="mb-4"
        contentClassName="space-y-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {isDev ? (
            <DashboardButton
              tone="primary"
              disabled={seedDemo.isPending}
              onClick={() => seedDemo.mutate()}
            >
              <Database className="mr-2 h-4 w-4" />
              {seedDemo.isPending ? "Loading…" : "Load demo catalog"}
            </DashboardButton>
          ) : null}
          <DashboardButton tone="outline" asChild>
            <Link href={inventoryInsuranceHref({ import: true })}>
              <FlaskConical className="mr-2 h-4 w-4" />
              Test formulary import
            </Link>
          </DashboardButton>
        </div>
        <p className="text-xs text-neutral-500">
          Base seed adds 8 products, 3 customers, and an &quot;RSSB Demo&quot; insurer — without
          pre-linked coverage, so you can practice the confirm step.
        </p>
        <ul className="space-y-2 text-sm">
          {DEMO_IMPORT_FILES.map((file) => (
            <li key={file.href} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
              <a
                href={file.href}
                download
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {file.label}
              </a>
              <span className="text-neutral-500">— {file.note}</span>
            </li>
          ))}
        </ul>
      </DashboardSectionCard>

      <div className="grid gap-4 md:grid-cols-2">
        {IMPORT_TEMPLATES.map((template) => (
          <DashboardSectionCard
            key={template.id}
            title={template.title}
            description={template.description}
            contentClassName="space-y-4"
          >
            <p className="text-xs text-neutral-500">
              Columns: {template.columns.join(" · ")}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <DashboardButton
                tone="outline"
                className="flex-1"
                onClick={() => void handleDownload(template.id)}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download template
              </DashboardButton>
              <DashboardButton tone="primary" className="flex-1" asChild>
                <Link href={importTemplateHref(template)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload file
                </Link>
              </DashboardButton>
            </div>
          </DashboardSectionCard>
        ))}
      </div>

      <DashboardSectionCard
        title="Recommended order"
        description="Import in this sequence for the smoothest go-live."
        className="mt-4"
        contentClassName="text-sm text-neutral-600 dark:text-neutral-400"
      >
        <ol className="list-decimal space-y-2 pl-5">
          <li>Inventory & products — required before POS or insurance coverage</li>
          <li>Customers — optional but speeds up checkout lookup</li>
          <li>Insurance coverage — after inventory is loaded</li>
          <li>Staff & team — send login invites last</li>
        </ol>
      </DashboardSectionCard>
    </>
  );
}
