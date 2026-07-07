"use client";

import { toast } from "sonner";
import {
  DashboardDialogActions,
  DashboardDialogBody,
  DashboardDialogContent,
  DashboardDialogDescription,
  DashboardDialogHeader,
  DashboardDialogTitle,
  Dialog,
} from "@/components/dashboard";
import { PharmacyReceiptPreview } from "@/components/pharmacy/pharmacy-receipt-preview";
import {
  printPosReceipt,
  type PosReceiptInput,
} from "@/lib/pos/print-receipt";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: PosReceiptInput | null;
};

export function PosReceiptPreviewDialog({ open, onOpenChange, receipt }: Props) {
  const handlePrint = async () => {
    if (!receipt) return;
    const result = await printPosReceipt(receipt);
    if (result.ok) {
      toast.success("Print dialog opened", {
        description: "Choose your printer or Save as PDF.",
      });
    } else {
      toast.error("Could not print receipt", { description: result.error });
    }
  };

  if (!receipt) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DashboardDialogContent className="sm:max-w-md">
        <DashboardDialogHeader>
          <DashboardDialogTitle>Sale receipt</DashboardDialogTitle>
          <DashboardDialogDescription>
            Review the receipt. Print only if you need a paper copy.
          </DashboardDialogDescription>
        </DashboardDialogHeader>
        <DashboardDialogBody>
          <PharmacyReceiptPreview
            profile={{
              name: receipt.pharmacyName,
              city: receipt.city,
              address: receipt.address,
              phone: receipt.phone,
              email: receipt.email,
              licenseNumber: receipt.licenseNumber,
            }}
            receiptNumber={receipt.receiptNumber}
            lines={receipt.items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              lineTotal: item.price * item.quantity,
            }))}
            total={receipt.subtotal}
            customerName={receipt.customer.name || "Walk-in customer"}
            patientName={receipt.patientName}
            cashierName={receipt.cashierName}
            paymentMethod={receipt.paymentMethod}
            insuranceCoverage={receipt.insuranceCoverage}
            patientAmount={receipt.patientAmount}
            footerText={receipt.footerText}
          />
        </DashboardDialogBody>
        <DashboardDialogActions
          cancelLabel="Done"
          confirmLabel="Print"
          onCancel={() => onOpenChange(false)}
          onConfirm={() => void handlePrint()}
        />
      </DashboardDialogContent>
    </Dialog>
  );
}
