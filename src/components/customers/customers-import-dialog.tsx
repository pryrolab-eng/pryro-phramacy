"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import {
  DashboardButton,
  DashboardDialogActions,
  DashboardDialogBody,
  DashboardDialogContent,
  DashboardDialogDescription,
  DashboardDialogHeader,
  DashboardDialogTitle,
} from "@/components/dashboard";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CUSTOMER_IMPORT_COLUMNS,
  customerPreviewToApiRow,
  validateCustomerImportRows,
  type CustomerImportPreviewRow,
} from "@/lib/import/customer-rows";
import { parseExcelFile } from "@/lib/import/parse-excel";
import { downloadImportTemplate } from "@/lib/import/templates";
import { useImportCustomersMutation } from "@/hooks/useCustomers";

type ImportSummary = {
  attempted: number;
  succeeded: number;
  failures: Array<{ rowNumber: number; label: string; error: string }>;
} | null;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CustomersImportDialog({ open, onOpenChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportCustomersMutation();
  const [previewData, setPreviewData] = useState<CustomerImportPreviewRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importSummary, setImportSummary] = useState<ImportSummary>(null);

  const resetState = () => {
    setPreviewData([]);
    setValidationErrors([]);
    setImportSummary(null);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const jsonData = await parseExcelFile(file);
      const { rows, errors } = validateCustomerImportRows(jsonData);
      setPreviewData(rows);
      setValidationErrors(errors);
      setImportSummary(null);
    } catch {
      toast.error("Could not read Excel file", {
        description: "Check the format and try again.",
      });
    }

    event.target.value = "";
  };

  const handleImport = async () => {
    const result = await importMutation.mutateAsync(
      previewData.map(customerPreviewToApiRow),
    );

    setImportSummary({
      attempted: result.attempted,
      succeeded: result.succeeded,
      failures: result.failures,
    });

    if (result.failures.length === 0) {
      resetState();
      onOpenChange(false);
      toast.success("Import complete", {
        description: `Imported ${result.succeeded} customer${result.succeeded === 1 ? "" : "s"}.`,
      });
      return;
    }

    toast.error(
      result.succeeded > 0 ? "Import partially completed" : "Import failed",
      {
        description: `${result.succeeded} of ${result.attempted} customers imported.`,
      },
    );
  };

  const downloadSample = async () => {
    await downloadImportTemplate("customers");
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) resetState();
          onOpenChange(next);
        }}
      >
        <DashboardDialogContent className="sm:max-w-lg">
          <DashboardDialogHeader>
            <DashboardDialogTitle>Import customers from Excel</DashboardDialogTitle>
            <DashboardDialogDescription>
              Upload a spreadsheet with customer profiles for POS and insurance
              lookup. Required columns: Name, Phone.
            </DashboardDialogDescription>
          </DashboardDialogHeader>
          <DashboardDialogBody className="space-y-4">
            {previewData.length === 0 ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <DashboardButton
                  tone="outline"
                  className="flex-1"
                  onClick={() => void downloadSample()}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Download sample
                </DashboardButton>
                <DashboardButton
                  tone="primary"
                  className="flex-1"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose file
                </DashboardButton>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {previewData.length} row{previewData.length === 1 ? "" : "s"}{" "}
                  ready to import
                </p>
                {validationErrors.length > 0 ? (
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                    {validationErrors.slice(0, 8).map((error) => (
                      <p key={error}>{error}</p>
                    ))}
                    {validationErrors.length > 8 ? (
                      <p>…and {validationErrors.length - 8} more</p>
                    ) : null}
                  </div>
                ) : null}
                {importSummary ? (
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-900/40">
                    <p>
                      Imported {importSummary.succeeded} of{" "}
                      {importSummary.attempted}
                    </p>
                    {importSummary.failures.length > 0 ? (
                      <ul className="mt-2 max-h-28 overflow-y-auto text-xs text-destructive">
                        {importSummary.failures.map((failure) => (
                          <li key={`${failure.rowNumber}-${failure.label}`}>
                            Row {failure.rowNumber} ({failure.label}):{" "}
                            {failure.error}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
            <p className="text-xs text-neutral-500">
              Columns: {CUSTOMER_IMPORT_COLUMNS.join(", ")}
            </p>
          </DashboardDialogBody>
          {previewData.length > 0 ? (
            <DashboardDialogActions
              cancelLabel="Clear"
              confirmLabel={
                importMutation.isPending
                  ? "Importing…"
                  : `Import ${previewData.length} customers`
              }
              onCancel={resetState}
              onConfirm={() => void handleImport()}
              confirmLoading={importMutation.isPending}
              confirmDisabled={
                validationErrors.length > 0 || importMutation.isPending
              }
            />
          ) : null}
        </DashboardDialogContent>
      </Dialog>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />
    </>
  );
}
