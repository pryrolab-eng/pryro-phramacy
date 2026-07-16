import type { CanvasElement } from "@/lib/admin/insurance-template-canvas";
import {
  PLACEHOLDER_SEAL,
  PLACEHOLDER_INSURANCE,
  PLACEHOLDER_RW,
  PLACEHOLDER_SIGNATURE,
  PLACEHOLDER_MOH,
  PLACEHOLDER_STAMP,
} from "@/lib/admin/insurance-template-placeholders";

export type InsuranceTemplatePresetId = "basic" | "professional" | "detailed";

export const INSURANCE_PRESET_LABELS: Record<
  InsuranceTemplatePresetId,
  { title: string; subtitle: string }
> = {
  basic: { title: "Rwanda medical claim", subtitle: "RSSB-style layout" },
  professional: { title: "Official certificate", subtitle: "Certificate layout" },
  detailed: { title: "Ministry health report", subtitle: "Detailed claim report" },
};

export function loadInsuranceTemplatePreset(
  templateType: InsuranceTemplatePresetId,
): CanvasElement[] {
  if (templateType === "basic") {
    return [
      { id: 1, type: "image", src: PLACEHOLDER_SEAL, x: 50, y: 20, width: 80, height: 80 },
      { id: 2, type: "title", text: "{{insurance_name}} MEDICAL CLAIM", x: 150, y: 30, fontSize: 22, fontWeight: "bold", width: 300, height: 35 },
      { id: 3, type: "text", text: "REPUBLIC OF RWANDA", x: 150, y: 65, fontSize: 14, width: 200, height: 25 },
      { id: 4, type: "line", x: 50, y: 120, width: 450, height: 3, backgroundColor: "#10b981" },
      { id: 5, type: "text", text: "PATIENT DETAILS", x: 50, y: 140, fontSize: 16, fontWeight: "bold", width: 200, height: 30 },
      { id: 6, type: "variable", variable: "patient_name", label: "Full Name", x: 50, y: 175, fontSize: 14, width: 200, height: 25 },
      { id: 7, type: "variable", variable: "policy_number", label: "Policy Number", x: 300, y: 175, fontSize: 14, width: 200, height: 25 },
      { id: 8, type: "variable", variable: "date", label: "Date of Service", x: 50, y: 210, fontSize: 14, width: 200, height: 25 },
      { id: 9, type: "text", text: "FINANCIAL SUMMARY", x: 50, y: 250, fontSize: 16, fontWeight: "bold", width: 200, height: 30 },
      { id: 10, type: "variable", variable: "amount", label: "Total Amount", x: 50, y: 285, fontSize: 16, width: 180, height: 30, suffix: " RWF" },
      { id: 11, type: "variable", variable: "coverage_percentage", label: "Coverage Rate", x: 250, y: 285, fontSize: 16, width: 150, height: 30, suffix: "%" },
      { id: 12, type: "text", text: "Authorized by {{insurance_name}} - Rwanda", x: 50, y: 340, fontSize: 12, width: 400, height: 25 },
    ];
  }
  if (templateType === "professional") {
    return [
      { id: 1, type: "image", src: PLACEHOLDER_INSURANCE, x: 50, y: 20, width: 150, height: 60 },
      { id: 2, type: "image", src: PLACEHOLDER_RW, x: 420, y: 20, width: 60, height: 60 },
      { id: 3, type: "title", text: "OFFICIAL INSURANCE CERTIFICATE", x: 120, y: 100, fontSize: 20, fontWeight: "bold", width: 350, height: 35 },
      { id: 4, type: "line", x: 50, y: 150, width: 450, height: 2, backgroundColor: "#1e40af" },
      { id: 5, type: "line", x: 50, y: 155, width: 450, height: 1, backgroundColor: "#dc2626" },
      { id: 6, type: "text", text: "Certificate No: {{policy_number}}", x: 50, y: 175, fontSize: 14, fontWeight: "bold", width: 250, height: 25 },
      { id: 7, type: "variable", variable: "date", label: "Issue Date", x: 320, y: 175, fontSize: 14, width: 180, height: 25 },
      { id: 8, type: "text", text: "BENEFICIARY INFORMATION", x: 50, y: 210, fontSize: 14, fontWeight: "bold", width: 250, height: 25 },
      { id: 9, type: "variable", variable: "patient_name", label: "Beneficiary Name", x: 50, y: 240, fontSize: 13, width: 220, height: 25 },
      { id: 10, type: "text", text: "COVERAGE DETAILS", x: 300, y: 210, fontSize: 14, fontWeight: "bold", width: 200, height: 25 },
      { id: 11, type: "variable", variable: "coverage_percentage", label: "Coverage Level", x: 300, y: 240, fontSize: 13, width: 150, height: 25, suffix: "% Coverage" },
      { id: 12, type: "text", text: "CLAIM AMOUNT", x: 50, y: 280, fontSize: 14, fontWeight: "bold", width: 200, height: 25 },
      { id: 13, type: "variable", variable: "amount", label: "Approved Amount", x: 50, y: 310, fontSize: 16, fontWeight: "bold", width: 200, height: 30, suffix: " RWF" },
      { id: 14, type: "line", x: 50, y: 360, width: 450, height: 1, backgroundColor: "#6b7280" },
      { id: 15, type: "text", text: "This certificate is valid and authorized by {{insurance_name}}", x: 50, y: 375, fontSize: 11, width: 400, height: 20 },
      { id: 16, type: "image", src: PLACEHOLDER_SIGNATURE, x: 350, y: 400, width: 100, height: 40 },
    ];
  }
  return [
    { id: 1, type: "image", src: PLACEHOLDER_MOH, x: 50, y: 20, width: 100, height: 100 },
    { id: 2, type: "title", text: "MINISTRY OF HEALTH", x: 170, y: 30, fontSize: 18, fontWeight: "bold", width: 250, height: 25 },
    { id: 3, type: "text", text: "REPUBLIC OF RWANDA", x: 170, y: 55, fontSize: 16, width: 200, height: 25 },
    { id: 4, type: "title", text: "MEDICAL INSURANCE CLAIM REPORT", x: 170, y: 80, fontSize: 16, fontWeight: "bold", width: 300, height: 25 },
    { id: 5, type: "line", x: 50, y: 140, width: 450, height: 3, backgroundColor: "#7c3aed" },
    { id: 6, type: "text", text: "INSURANCE PROVIDER: {{insurance_name}}", x: 50, y: 160, fontSize: 14, fontWeight: "bold", width: 300, height: 25 },
    { id: 7, type: "variable", variable: "policy_number", label: "Policy Reference", x: 350, y: 160, fontSize: 14, width: 150, height: 25 },
    { id: 8, type: "line", x: 50, y: 190, width: 450, height: 1, backgroundColor: "#d1d5db" },
    { id: 9, type: "text", text: "PATIENT INFORMATION", x: 50, y: 210, fontSize: 14, fontWeight: "bold", width: 200, height: 25 },
    { id: 10, type: "variable", variable: "patient_name", label: "Patient Full Name", x: 50, y: 235, fontSize: 12, width: 200, height: 20 },
    { id: 11, type: "variable", variable: "date", label: "Treatment Date", x: 270, y: 235, fontSize: 12, width: 150, height: 20 },
    { id: 12, type: "text", text: "MEDICAL FACILITY", x: 50, y: 265, fontSize: 14, fontWeight: "bold", width: 200, height: 25 },
    { id: 13, type: "text", text: "Hospital/Clinic Name: ________________", x: 50, y: 290, fontSize: 12, width: 300, height: 20 },
    { id: 14, type: "text", text: "FINANCIAL BREAKDOWN", x: 50, y: 320, fontSize: 14, fontWeight: "bold", width: 200, height: 25 },
    { id: 15, type: "variable", variable: "amount", label: "Total Medical Cost", x: 50, y: 345, fontSize: 13, width: 180, height: 25, suffix: " RWF" },
    { id: 16, type: "variable", variable: "coverage_percentage", label: "Insurance Coverage", x: 250, y: 345, fontSize: 13, width: 150, height: 25, suffix: "%" },
    { id: 17, type: "text", text: "Patient Responsibility: _______ RWF", x: 50, y: 375, fontSize: 13, width: 250, height: 25 },
    { id: 18, type: "line", x: 50, y: 410, width: 450, height: 2, backgroundColor: "#7c3aed" },
    { id: 19, type: "text", text: "AUTHORIZATION", x: 50, y: 430, fontSize: 14, fontWeight: "bold", width: 200, height: 25 },
    { id: 20, type: "text", text: "Approved by: ________________", x: 50, y: 455, fontSize: 12, width: 200, height: 20 },
    { id: 21, type: "text", text: "Date: ________________", x: 270, y: 455, fontSize: 12, width: 150, height: 20 },
      { id: 22, type: "image", src: PLACEHOLDER_STAMP, x: 400, y: 450, width: 80, height: 40 },
    { id: 23, type: "text", text: "This document is official and legally binding under Rwanda Insurance Law", x: 50, y: 510, fontSize: 10, width: 450, height: 20 },
  ];
}
