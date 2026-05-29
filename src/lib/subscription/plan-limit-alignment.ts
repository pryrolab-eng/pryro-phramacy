import { LIMIT_FEATURE_KEYS } from "./feature-catalog";

/** Boolean features required when a plan limit column is above its baseline. */
export const LIMIT_BOOLEAN_REQUIREMENTS: Record<
  "max_branches" | "max_users" | "monthly_tx_limit",
  { featureKeys: string[]; minExclusive: number; label: string }
> = {
  max_branches: {
    featureKeys: ["branches.access", "branches.create"],
    minExclusive: 1,
    label: "branches",
  },
  max_users: {
    featureKeys: ["staff.invite"],
    minExclusive: 1,
    label: "staff invite",
  },
  monthly_tx_limit: {
    featureKeys: ["pos.access"],
    minExclusive: 0,
    label: "POS transactions",
  },
};

export type PlanLimitMisalignment = {
  column: keyof typeof LIMIT_BOOLEAN_REQUIREMENTS;
  value: number;
  missingFeatureKeys: string[];
  label: string;
};

export function findPlanLimitMisalignments(input: {
  max_branches?: number;
  max_users?: number;
  monthly_tx_limit?: number;
  feature_keys?: string[];
}): PlanLimitMisalignment[] {
  const keys = new Set(input.feature_keys ?? []);
  const misalignments: PlanLimitMisalignment[] = [];

  const limits = {
    max_branches: Number(input.max_branches ?? 1),
    max_users: Number(input.max_users ?? 1),
    monthly_tx_limit: Number(input.monthly_tx_limit ?? 0),
  };

  for (const column of Object.keys(LIMIT_BOOLEAN_REQUIREMENTS) as Array<
    keyof typeof LIMIT_BOOLEAN_REQUIREMENTS
  >) {
    const rule = LIMIT_BOOLEAN_REQUIREMENTS[column];
    const value = limits[column];
    if (value <= rule.minExclusive) continue;

    const missingFeatureKeys = rule.featureKeys.filter((k) => !keys.has(k));
    if (missingFeatureKeys.length > 0) {
      misalignments.push({
        column,
        value,
        missingFeatureKeys,
        label: rule.label,
      });
    }
  }

  return misalignments;
}

export function formatPlanLimitMisalignmentError(
  misalignments: PlanLimitMisalignment[],
): string | null {
  if (misalignments.length === 0) return null;
  const labels = misalignments.map((m) => m.label);
  return `Enable ${labels.join(", ")} features before raising those limits.`;
}

export function validateMainPlanLimitAlignment(input: {
  plan_type?: string | null;
  max_branches?: number | null;
  max_users?: number | null;
  monthly_tx_limit?: number | null;
  feature_keys?: string[];
}): string | null {
  const planType = String(input.plan_type ?? "main").trim().toLowerCase();
  if (planType === "branch_addon") return null;
  return formatPlanLimitMisalignmentError(
    findPlanLimitMisalignments({
      max_branches: input.max_branches ?? undefined,
      max_users: input.max_users ?? undefined,
      monthly_tx_limit: input.monthly_tx_limit ?? undefined,
      feature_keys: input.feature_keys,
    }),
  );
}

export function canEditPlanLimit(
  column: keyof typeof LIMIT_BOOLEAN_REQUIREMENTS,
  featureKeys: string[],
): boolean {
  return LIMIT_BOOLEAN_REQUIREMENTS[column].featureKeys.every((k) =>
    featureKeys.includes(k),
  );
}

export function clampPlanLimitValue(
  column: keyof typeof LIMIT_BOOLEAN_REQUIREMENTS,
  value: number,
  featureKeys: string[],
): number {
  const rule = LIMIT_BOOLEAN_REQUIREMENTS[column];
  if (canEditPlanLimit(column, featureKeys)) return value;
  return rule.minExclusive;
}

export function applyPlanLimitsForFeatures(input: {
  feature_keys: string[];
  max_branches: number;
  max_users: number;
  monthly_tx_limit: number;
}): {
  feature_keys: string[];
  max_branches: number;
  max_users: number;
  monthly_tx_limit: number;
} {
  const { feature_keys } = input;
  return {
    feature_keys,
    max_branches: clampPlanLimitValue(
      "max_branches",
      input.max_branches,
      feature_keys,
    ),
    max_users: clampPlanLimitValue("max_users", input.max_users, feature_keys),
    monthly_tx_limit: clampPlanLimitValue(
      "monthly_tx_limit",
      input.monthly_tx_limit,
      feature_keys,
    ),
  };
}

/** Catalog limit keys (for reference / future UI). */
export const LIMIT_CATALOG_KEYS = LIMIT_FEATURE_KEYS;
