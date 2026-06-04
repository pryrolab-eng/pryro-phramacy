export type InsuranceIntegrationType = "manual" | "api_rssb" | "api_rama";

export type CoverageLineInput = {
  inventoryId?: string;
  medicationId: string;
  medicationName?: string;
  quantity: number;
  shelfUnitPrice: number;
};

export type CoverageLineResult = {
  inventoryId?: string;
  medicationId: string;
  medicationName?: string;
  quantity: number;
  isCovered: boolean;
  shelfUnitPrice: number;
  insuredUnitPrice: number;
  coveragePercent: number;
  insurerPays: number;
  patientPays: number;
  reason?: "covered" | "not_covered" | "not_listed";
};

export type CoverageTotals = {
  subtotal: number;
  insuranceCoverage: number;
  patientCopay: number;
  lines: CoverageLineResult[];
};
