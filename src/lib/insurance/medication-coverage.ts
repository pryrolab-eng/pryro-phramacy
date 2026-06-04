export type MedicationProviderCoverage = {
  covered?: boolean;
  externalCode?: string;
  notes?: string;
  effectiveFrom?: string;
  effectiveTo?: string | null;
};

export type MedicationInsuranceCoverageMap = Record<
  string,
  MedicationProviderCoverage
>;

export function parseMedicationInsuranceCoverage(
  raw: unknown,
): MedicationInsuranceCoverageMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const out: MedicationInsuranceCoverageMap = {};
  for (const [providerId, value] of Object.entries(
    raw as Record<string, unknown>,
  )) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const entry = value as Record<string, unknown>;
    out[providerId] = {
      covered: entry.covered === undefined ? undefined : Boolean(entry.covered),
      externalCode:
        typeof entry.externalCode === "string"
          ? entry.externalCode
          : undefined,
      notes: typeof entry.notes === "string" ? entry.notes : undefined,
      effectiveFrom:
        typeof entry.effectiveFrom === "string"
          ? entry.effectiveFrom
          : undefined,
      effectiveTo:
        entry.effectiveTo === null || typeof entry.effectiveTo === "string"
          ? (entry.effectiveTo as string | null)
          : undefined,
    };
  }
  return out;
}

function parseDateOnly(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const d = new Date(`${trimmed}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** True when entry is within optional effectiveFrom / effectiveTo (inclusive, date-only). */
export function isProviderCoverageActive(
  entry: MedicationProviderCoverage,
  refDate: Date = new Date(),
): boolean {
  const ref = refDate.toISOString().slice(0, 10);
  if (entry.effectiveFrom) {
    const from = parseDateOnly(entry.effectiveFrom);
    if (from && ref < entry.effectiveFrom) return false;
  }
  if (entry.effectiveTo) {
    const to = parseDateOnly(entry.effectiveTo);
    if (to && ref > entry.effectiveTo) return false;
  }
  return true;
}

export function getMedicationProviderEntry(
  coverage: MedicationInsuranceCoverageMap,
  providerId: string,
): MedicationProviderCoverage | undefined {
  return coverage[providerId];
}

export function mergeProviderCoverage(
  coverage: MedicationInsuranceCoverageMap,
  providerId: string,
  patch: Partial<MedicationProviderCoverage>,
): MedicationInsuranceCoverageMap {
  const prev = coverage[providerId] ?? {};
  const next: MedicationProviderCoverage = { ...prev, ...patch };
  if (patch.covered === false) {
    next.covered = false;
  }
  return { ...coverage, [providerId]: next };
}
