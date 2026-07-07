"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  DashboardButton,
  DashboardDialogBody,
  DashboardDialogContent,
  DashboardDialogDescription,
  DashboardDialogFooter,
  DashboardDialogHeader,
  DashboardDialogTitle,
} from "@/components/dashboard";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PosCustomer } from "@/hooks/usePos";
import type { CoverageLineResult } from "@/lib/insurance/types";

function coverageReasonLabel(reason?: CoverageLineResult["reason"]): string {
  if (reason === "not_listed") return "Not on formulary";
  if (reason === "not_covered") return "Not covered";
  return "Covered";
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}

export type PosInsuranceProcessingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: PosCustomer;
  onCustomerChange: (customer: PosCustomer) => void;
  subtotal: number;
  insuranceCoverage: number;
  patientCopay: number;
  cartItemCount: number;
  coverageLines?: CoverageLineResult[];
  coverageLoading?: boolean;
  onOpenRamaBeneficiary?: () => void;
  onLookup: (insuranceNumber: string) => Promise<{
    success?: boolean;
    insuranceType?: string;
    coveragePercent?: number;
    error?: string;
  }>;
  onProcess: (payload: {
    insuranceType: string;
    patientId: string;
    patientName?: string;
    totalAmount: number;
    insuranceCoverage: number;
    patientCopay: number;
    metadata?: Record<string, unknown>;
    lines?: Array<{
      inventoryId?: string;
      medicationId: string;
      medicationName?: string;
      quantity: number;
      shelfUnitPrice: number;
    }>;
  }) => Promise<{
    success?: boolean;
    claim?: { claimId?: string; approvalCode?: string };
    error?: string;
  }>;
  lookupPending?: boolean;
  processPending?: boolean;
};

export function PosInsuranceProcessingDialog({
  open,
  onOpenChange,
  customer,
  onCustomerChange,
  subtotal,
  insuranceCoverage,
  patientCopay,
  cartItemCount,
  coverageLines = [],
  coverageLoading = false,
  onOpenRamaBeneficiary,
  onLookup,
  onProcess,
  lookupPending,
  processPending,
}: PosInsuranceProcessingDialogProps) {
  const [tinInsurance, setTinInsurance] = useState("");
  const [patientId, setPatientId] = useState("");
  const [ordonnanceNumber, setOrdonnanceNumber] = useState("");
  const [prescriberName, setPrescriberName] = useState("");
  const [hsp, setHsp] = useState("");
  const [physicianOrderNumber, setPhysicianOrderNumber] = useState("");
  const [tinPatient, setTinPatient] = useState("");
  const [paymentType, setPaymentType] = useState("BANQUEBKRWF");
  const [transactionId, setTransactionId] = useState("");
  const [printReceipt, setPrintReceipt] = useState(true);
  const [verifyCheck, setVerifyCheck] = useState(false);

  const calculatedCopay = Math.round(patientCopay);
  const canProcess = cartItemCount > 0 && subtotal > 0 && !coverageLoading;

  useEffect(() => {
    if (!open) return;
    setPatientId(customer.insuranceNumber || "");
  }, [open, customer.insuranceNumber]);

  const handleSaveDraft = () => {
    const draft = {
      tinInsurance,
      patientId,
      ordonnanceNumber,
      prescriberName,
      hsp,
      physicianOrderNumber,
      tinPatient,
      amountPaid: calculatedCopay,
      paymentType,
      transactionId,
      validityRate: customer.coveragePercent,
      customer,
      subtotal,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem("pos_insurance_draft", JSON.stringify(draft));
    toast.success("Insurance draft saved locally");
  };

  const handleRequestApproval = async () => {
    const id = patientId.trim() || customer.insuranceNumber.trim();
    if (!id) {
      toast.error("Enter a patient or membership number first");
      return;
    }
    try {
      const result = await onLookup(id);
      if (result.success) {
        toast.success(
          `Approved: ${result.insuranceType ?? customer.insuranceType} · ${result.coveragePercent ?? customer.coveragePercent}% coverage`,
        );
      } else {
        toast.error(result.error || "Insurance verification failed");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not verify insurance",
      );
    }
  };

  const handleFinish = async () => {
    if (cartItemCount === 0 || subtotal <= 0) {
      toast.error("Add products to the cart before processing insurance");
      return;
    }
    if (coverageLoading) {
      toast.error("Coverage is still calculating — try again in a moment");
      return;
    }
    if (!customer.insuranceType) {
      toast.error("Select an insurance type on the order first");
      return;
    }
    const id = patientId.trim() || customer.insuranceNumber.trim();
    if (!id) {
      toast.error("Patient / membership number is required");
      return;
    }
    try {
      const result = await onProcess({
        insuranceType: customer.insuranceType,
        patientId: id,
        patientName: customer.name,
        totalAmount: subtotal,
        insuranceCoverage,
        patientCopay,
        metadata: {
          tinInsurance,
          ordonnanceNumber,
          prescriberName,
          hsp,
          physicianOrderNumber,
          tinPatient,
          amountPaid: calculatedCopay,
          paymentType,
          transactionId,
          validityRate: customer.coveragePercent,
          printReceipt,
          verifyCheck,
        },
      });
      if (result.success && result.claim) {
        toast.success("Insurance claim recorded", {
          description: [
            result.claim.claimId && `Claim ${result.claim.claimId}`,
            result.claim.approvalCode &&
              `Approval ${result.claim.approvalCode}`,
          ]
            .filter(Boolean)
            .join(" · "),
        });
        onOpenChange(false);
      } else {
        toast.error(result.error || "Insurance processing failed");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Insurance processing failed",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DashboardDialogContent className="sm:max-w-2xl">
        <DashboardDialogHeader>
          <DashboardDialogTitle>Insurance processing</DashboardDialogTitle>
          <DashboardDialogDescription>
            Add items to the cart first. Copay is calculated per product from
            your insurance formulary — confirm claim details, then finish.
          </DashboardDialogDescription>
        </DashboardDialogHeader>

        <DashboardDialogBody>
          {!canProcess ? (
            <div
              className="mb-4 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100"
              role="status"
            >
              {cartItemCount === 0
                ? "Your cart is empty. Add covered products, then open this form again."
                : coverageLoading
                  ? "Calculating coverage from cart items…"
                  : "Cart total is zero — check product prices and quantities."}
            </div>
          ) : null}

          <div
            className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-neutral-200/80 bg-neutral-200/80 text-center text-sm dark:border-neutral-800 dark:bg-neutral-800"
            role="group"
            aria-label="Sale amount breakdown"
          >
            <div className="bg-white px-3 py-3 dark:bg-neutral-900">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Cart total
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                {subtotal.toLocaleString()}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  RWF
                </span>
              </p>
            </div>
            <div className="bg-white px-3 py-3 dark:bg-neutral-900">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Insurance pays
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                {insuranceCoverage.toLocaleString()}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  RWF
                </span>
              </p>
              {customer.insuranceType ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {customer.insuranceType}
                </p>
              ) : null}
            </div>
            <div className="bg-white px-3 py-3 dark:bg-neutral-900">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Patient copay
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-primary">
                {patientCopay.toLocaleString()}{" "}
                <span className="text-xs font-medium text-muted-foreground">
                  RWF
                </span>
              </p>
            </div>
          </div>

          {coverageLines.length > 0 ? (
            <div className="mb-6 overflow-hidden rounded-lg border border-neutral-200/80 dark:border-neutral-800">
              <div className="border-b border-neutral-200/80 bg-neutral-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:border-neutral-800 dark:bg-neutral-900/50">
                Coverage by product
              </div>
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {coverageLines.map((line) => (
                  <li
                    key={`${line.medicationId}-${line.inventoryId ?? "x"}`}
                    className="flex flex-wrap items-start justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {line.medicationName ?? "Product"} × {line.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {coverageReasonLabel(line.reason)}
                        {line.isCovered && line.coveragePercent > 0
                          ? ` · ${line.coveragePercent}%`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right text-xs tabular-nums">
                      <p className="text-muted-foreground">
                        Insurer {line.insurerPays.toLocaleString()} RWF
                      </p>
                      <p className="font-medium text-foreground">
                        Patient {line.patientPays.toLocaleString()} RWF
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-6">
            <FormSection title="Insurer & patient">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Insurance provider">
                  <Input
                    value={customer.insuranceType || ""}
                    placeholder="Select insurance on the order panel"
                    disabled
                  />
                </Field>
                <Field label="Insurer TIN" htmlFor="insurance-tin">
                  <Input
                    id="insurance-tin"
                    placeholder="e.g. 102495653"
                    value={tinInsurance}
                    onChange={(e) => setTinInsurance(e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Patient / membership number" htmlFor="patient-id">
                <div className="flex gap-2">
                  <Input
                    id="patient-id"
                    placeholder="e.g. 01580533"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                    className="flex-1"
                  />
                  {customer.insuranceType === "RAMA" && onOpenRamaBeneficiary ? (
                    <DashboardButton
                      type="button"
                      size="icon"
                      title="Add RAMA beneficiary"
                      onClick={onOpenRamaBeneficiary}
                    >
                      <Plus className="h-4 w-4" />
                    </DashboardButton>
                  ) : null}
                </div>
              </Field>
            </FormSection>

            <FormSection title="Prescription">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Ordonnance number" htmlFor="ordonnance">
                  <Input
                    id="ordonnance"
                    placeholder="e.g. ORD-2026-00421"
                    value={ordonnanceNumber}
                    onChange={(e) => setOrdonnanceNumber(e.target.value)}
                  />
                </Field>
                <Field label="Prescriber name" htmlFor="prescriber">
                  <Input
                    id="prescriber"
                    placeholder="e.g. Dr. Marie Uwase"
                    value={prescriberName}
                    onChange={(e) => setPrescriberName(e.target.value)}
                  />
                </Field>
                <Field label="HSP" htmlFor="hsp">
                  <Input
                    id="hsp"
                    placeholder="e.g. CHUK"
                    value={hsp}
                    onChange={(e) => setHsp(e.target.value)}
                  />
                </Field>
                <Field label="Physician order number" htmlFor="physician-order">
                  <Input
                    id="physician-order"
                    placeholder="e.g. PO-88421"
                    value={physicianOrderNumber}
                    onChange={(e) => setPhysicianOrderNumber(e.target.value)}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection title="Payment & client">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Client name" htmlFor="client-name">
                  <Input
                    id="client-name"
                    placeholder="e.g. Jean Baptiste"
                    value={customer.name}
                    onChange={(e) =>
                      onCustomerChange({ ...customer, name: e.target.value })
                    }
                  />
                </Field>
                <Field label="Patient TIN" htmlFor="patient-tin">
                  <Input
                    id="patient-tin"
                    placeholder="e.g. 123456789"
                    value={tinPatient}
                    onChange={(e) => setTinPatient(e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Patient copay (calculated)" htmlFor="amount-paid">
                <Input
                  id="amount-paid"
                  readOnly
                  value={`${calculatedCopay.toLocaleString()} RWF`}
                  className="bg-muted/50 font-semibold tabular-nums"
                />
                <p className="text-xs text-muted-foreground">
                  Sum of patient portions from covered and uncovered lines above.
                  Collect this amount at payment — do not edit manually.
                </p>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Payment type">
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANQUEBKRWF">Bank (RWF)</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="MOBILE">Mobile money</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Transaction ID" htmlFor="transaction-id">
                  <Input
                    id="transaction-id"
                    placeholder="e.g. TXN-20260529-001"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                </Field>
              </div>
              <div className="flex flex-wrap gap-4 rounded-lg border border-neutral-200/80 bg-neutral-50/80 px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900/50">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300"
                    checked={printReceipt}
                    onChange={(e) => setPrintReceipt(e.target.checked)}
                  />
                  Print receipt after claim
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300"
                    checked={verifyCheck}
                    onChange={(e) => setVerifyCheck(e.target.checked)}
                  />
                  Require manual verification
                </label>
              </div>
            </FormSection>
          </div>
        </DashboardDialogBody>

        <DashboardDialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <DashboardButton type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </DashboardButton>
          <DashboardButton type="button" onClick={handleSaveDraft}>
            Save draft
          </DashboardButton>
          <DashboardButton
            type="button"
            onClick={() => void handleRequestApproval()}
            disabled={lookupPending}
          >
            {lookupPending ? "Verifying…" : "Request approval"}
          </DashboardButton>
          <DashboardButton
            type="button"
            tone="primary"
            onClick={() => void handleFinish()}
            disabled={processPending || !canProcess}
          >
            {processPending ? "Processing…" : "Finish & close"}
          </DashboardButton>
        </DashboardDialogFooter>
      </DashboardDialogContent>
    </Dialog>
  );
}
