export type MatchConfidence = "exact" | "high" | "medium" | "low" | "none";

export type CatalogMedication = {
  medicationId: string;
  name: string;
};

export type MedicationMatchCandidate = {
  medicationId: string;
  name: string;
  score: number;
  confidence: MatchConfidence;
};

export type FormularyMatchPreview = {
  rowNumber: number;
  insurerName: string;
  insurerCode?: string;
  referencePrice?: number;
  suggested: MedicationMatchCandidate | null;
  alternatives: MedicationMatchCandidate[];
};

const FORM_TOKENS =
  /\b(tablets?|tabs?|caps?(?:ules?)?|caplets?|syrup|suspension|susp|cream|ointment|gel|solution|injection|inj|oral|coated|film|modified|release|mr|sr|xr|hcl|sodium|potassium)\b/gi;

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i += 1) matrix[i] = [i];
  for (let j = 0; j <= a.length; j += 1) matrix[0]![j] = j;

  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost,
      );
    }
  }

  return matrix[b.length]![a.length]!;
}

export function normalizeMedicationNameForMatch(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(\d)\s*(mg|g|ml|mcg|iu)\b/gi, "$1$2")
    .replace(FORM_TOKENS, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenOverlapScore(a: string, b: string): number {
  const ta = new Set(normalizeMedicationNameForMatch(a).split(" ").filter(Boolean));
  const tb = new Set(normalizeMedicationNameForMatch(b).split(" ").filter(Boolean));
  if (ta.size === 0 || tb.size === 0) return 0;

  let shared = 0;
  for (const token of Array.from(ta)) {
    if (tb.has(token)) shared += 1;
  }

  return (shared / Math.max(ta.size, tb.size)) * 100;
}

export function scoreMedicationNameMatch(
  insurerName: string,
  inventoryName: string,
): number {
  const rawA = insurerName.trim();
  const rawB = inventoryName.trim();
  if (!rawA || !rawB) return 0;

  if (rawA.toLowerCase() === rawB.toLowerCase()) return 100;

  const normA = normalizeMedicationNameForMatch(rawA);
  const normB = normalizeMedicationNameForMatch(rawB);
  if (normA && normA === normB) return 98;

  const tokenScore = tokenOverlapScore(rawA, rawB);
  const maxLen = Math.max(normA.length, normB.length);
  const distance = maxLen > 0 ? levenshtein(normA, normB) : 0;
  const levenScore = maxLen > 0 ? Math.max(0, 100 - (distance / maxLen) * 100) : 0;

  if (normA.includes(normB) || normB.includes(normA)) {
    return Math.max(tokenScore, levenScore, 88);
  }

  return Math.max(tokenScore * 0.7 + levenScore * 0.3, tokenScore, levenScore);
}

export function confidenceFromScore(score: number): MatchConfidence {
  if (score >= 98) return "exact";
  if (score >= 85) return "high";
  if (score >= 70) return "medium";
  if (score >= 55) return "low";
  return "none";
}

export function rankMedicationMatches(
  insurerName: string,
  catalog: CatalogMedication[],
  limit = 5,
): MedicationMatchCandidate[] {
  const ranked = catalog
    .map((item) => {
      const score = scoreMedicationNameMatch(insurerName, item.name);
      return {
        medicationId: item.medicationId,
        name: item.name,
        score: Math.round(score),
        confidence: confidenceFromScore(score),
      };
    })
    .filter((item) => item.score >= 40)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return ranked.slice(0, limit);
}

export function shouldAutoConfirmMatch(
  candidate: MedicationMatchCandidate | null,
): boolean {
  if (!candidate) return false;
  return candidate.confidence === "exact" || candidate.confidence === "high";
}

export function buildFormularyMatchPreviews(input: {
  rows: Array<{
    insurerName: string;
    insurerCode?: string;
    referencePrice?: number;
  }>;
  catalog: CatalogMedication[];
}): FormularyMatchPreview[] {
  return input.rows.map((row, index) => {
    const alternatives = rankMedicationMatches(row.insurerName, input.catalog);
    const suggested = alternatives[0] ?? null;
    return {
      rowNumber: index + 2,
      insurerName: row.insurerName,
      insurerCode: row.insurerCode,
      referencePrice: row.referencePrice,
      suggested,
      alternatives,
    };
  });
}
