import { normalizePlanName } from "./dedupe-plans";

/** Known typos / alternate spellings → canonical catalog name (lowercase). */
const PLAN_NAME_ALIASES: Record<string, string> = {
  stater: "starter",
};

export function canonicalPlanName(name: string): string {
  const normalized = normalizePlanName(name);
  if (!normalized) return "";
  return PLAN_NAME_ALIASES[normalized] ?? normalized;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i += 1) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[b.length][a.length];
}

/** True when two names would represent the same catalog tier (exact, alias, or typo). */
export function arePlanNamesConflicting(a: string, b: string): boolean {
  const ca = canonicalPlanName(a);
  const cb = canonicalPlanName(b);
  if (!ca || !cb) return false;
  if (ca === cb) return true;

  const maxLen = Math.max(ca.length, cb.length);
  if (maxLen >= 4 && maxLen <= 10) {
    const dist = levenshtein(ca, cb);
    return dist <= 1 && Math.abs(ca.length - cb.length) <= 1;
  }

  return false;
}

export type PlanNameRow = {
  id: string;
  name: string;
  plan_type?: string | null;
  is_active?: boolean | null;
};

export function normalizePlanType(raw?: string | null): "main" | "branch_addon" {
  return String(raw ?? "main").trim().toLowerCase() === "branch_addon"
    ? "branch_addon"
    : "main";
}

export function findPlanNameConflict(
  plans: PlanNameRow[],
  name: string,
  planType: "main" | "branch_addon",
  excludeId?: string,
): PlanNameRow | undefined {
  return plans
    .filter((p) => p.is_active !== false && p.id !== excludeId)
    .find(
      (p) =>
        normalizePlanType(p.plan_type) === planType &&
        arePlanNamesConflicting(p.name, name),
    );
}

export function formatPlanNameConflictError(
  existing: PlanNameRow,
  requestedName: string,
): string {
  if (normalizePlanName(existing.name) === normalizePlanName(requestedName)) {
    return `A plan named "${existing.name}" already exists. Edit the existing plan or remove duplicates first.`;
  }
  return `A plan named "${existing.name}" is too similar to "${requestedName}". Use a distinct name or edit the existing plan.`;
}

export function isPostgresUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "23505"
  );
}
