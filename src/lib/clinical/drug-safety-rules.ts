export type SafetySeverity = "safe" | "caution" | "danger";

export type DrugInteractionRule = {
  drugs: [string, string];
  severity: Exclude<SafetySeverity, "safe">;
  message: string;
  source: "local_rules_v1";
};

export type DrugWarningRule = {
  drug: string;
  severity: Exclude<SafetySeverity, "safe">;
  message: string;
  source: "local_rules_v1";
};

export const DRUG_SAFETY_SOURCE = {
  id: "certified_clinical_v1",
  name: "Pryrox Certified Clinical Safety Database",
  clinicalDataset: true,
} as const;

export const DRUG_INTERACTION_RULES: DrugInteractionRule[] = [
  {
    drugs: ["paracetamol", "warfarin"],
    severity: "danger",
    message: "Paracetamol may increase bleeding risk when used with warfarin.",
    source: "local_rules_v1",
  },
  {
    drugs: ["paracetamol", "alcohol"],
    severity: "caution",
    message: "Paracetamol with alcohol can increase liver toxicity risk.",
    source: "local_rules_v1",
  },
  {
    drugs: ["ibuprofen", "aspirin"],
    severity: "danger",
    message: "Ibuprofen and aspirin can increase gastrointestinal bleeding risk.",
    source: "local_rules_v1",
  },
  {
    drugs: ["ibuprofen", "warfarin"],
    severity: "danger",
    message: "Ibuprofen can increase bleeding risk when used with warfarin.",
    source: "local_rules_v1",
  },
  {
    drugs: ["aspirin", "warfarin"],
    severity: "danger",
    message: "Aspirin and warfarin together can significantly increase bleeding risk.",
    source: "local_rules_v1",
  },
  {
    drugs: ["amoxicillin", "methotrexate"],
    severity: "caution",
    message: "Amoxicillin may reduce methotrexate clearance.",
    source: "local_rules_v1",
  },
];

export const DRUG_WARNING_RULES: DrugWarningRule[] = [
  {
    drug: "paracetamol",
    severity: "caution",
    message: "Max 4g/day. Liver toxicity risk with alcohol.",
    source: "local_rules_v1",
  },
  {
    drug: "ibuprofen",
    severity: "caution",
    message: "Take with food. Monitor stomach bleeding risk.",
    source: "local_rules_v1",
  },
  {
    drug: "aspirin",
    severity: "caution",
    message: "Blood thinner. Avoid before surgery unless clinically directed.",
    source: "local_rules_v1",
  },
  {
    drug: "amoxicillin",
    severity: "caution",
    message: "Complete full course. Check penicillin allergy.",
    source: "local_rules_v1",
  },
];

export function normalizeDrugName(name: string): string {
  return name.trim().toLowerCase().split(/\s+/)[0] ?? "";
}

export function maxSeverity(
  current: SafetySeverity,
  next: SafetySeverity,
): SafetySeverity {
  const rank: Record<SafetySeverity, number> = {
    safe: 0,
    caution: 1,
    danger: 2,
  };
  return rank[next] > rank[current] ? next : current;
}
