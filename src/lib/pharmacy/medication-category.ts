/** Maps UI / catalog category labels to `medication_category` enum values. */
const LABEL_TO_ENUM: Record<string, string> = {
  "pain relief": "otc",
  antibiotics: "prescription",
  vitamins: "supplement",
  supplements: "supplement",
  prescription: "prescription",
  "prescription medications": "prescription",
  "over-the-counter": "otc",
  otc: "otc",
  controlled: "controlled",
  "medical device": "medical_device",
  "medical devices": "medical_device",
  "baby care": "otc",
  "personal care": "otc",
  general: "otc",
};

export function resolveMedicationCategoryEnum(label: string): string {
  const key = label.trim().toLowerCase();
  return LABEL_TO_ENUM[key] ?? "otc";
}

/** Whether a catalog chip / filter label matches a product category name. */
export function medicationCategoryMatchesFilter(
  filterLabel: string,
  productCategory: string | null | undefined,
): boolean {
  if (filterLabel === "all") return true;
  if (!productCategory) return false;
  const filter = filterLabel.trim().toLowerCase();
  const product = productCategory.trim().toLowerCase();
  if (filter === product) return true;
  return resolveMedicationCategoryEnum(filterLabel) === productCategory;
}
