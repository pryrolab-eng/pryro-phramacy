// ─────────────────────────────────────────────────────────────
// Feature Access Control
// Maps feature keys to plan features array values.
// Used by FeatureGate component and server-side checks.
// ─────────────────────────────────────────────────────────────

export type FeatureKey =
  | 'pos'
  | 'inventory'
  | 'reports'
  | 'insurance'
  | 'analytics'
  | 'multi_branch'
  | 'staff_management'
  | 'patients'
  | 'prescriptions'
  | 'advanced_reports'
  | 'custom_integrations'
  | 'priority_support'

// Maps feature keys → strings that appear in plan.features[]
// A plan grants access if ANY of the strings in the array is found
// (case-insensitive substring match) in the plan's features list.
export const FEATURE_STRINGS: Record<FeatureKey, string[]> = {
  pos:                 ['pos', 'point of sale'],
  inventory:           ['inventory'],
  reports:             ['report'],
  insurance:           ['insurance'],
  analytics:           ['analytics', 'advanced report'],
  multi_branch:        ['branch', 'multi-branch'],
  staff_management:    ['staff', 'user'],
  patients:            ['patient', 'prescription'],
  prescriptions:       ['prescription'],
  advanced_reports:    ['advanced report', 'analytics'],
  custom_integrations: ['custom integration'],
  priority_support:    ['priority support'],
}

export interface FeatureAccessResult {
  allowed: boolean
  reason?: string
  requiredPlanNames?: string[]
}

/**
 * Check if a plan's features array grants access to a feature key.
 * Works purely on the features string array — no DB call needed.
 */
export function planGrantsFeature(
  planFeatures: string[],
  featureKey: FeatureKey
): boolean {
  const needles = FEATURE_STRINGS[featureKey] ?? []
  const lower = planFeatures.map(f => f.toLowerCase())
  return needles.some(needle => lower.some(f => f.includes(needle)))
}

/**
 * Human-readable label for each feature key.
 */
export const FEATURE_LABELS: Record<FeatureKey, string> = {
  pos:                 'Point of Sale (POS)',
  inventory:           'Inventory Management',
  reports:             'Reports',
  insurance:           'Insurance Billing',
  analytics:           'Advanced Analytics',
  multi_branch:        'Multi-Branch Management',
  staff_management:    'Staff Management',
  patients:            'Patient Records',
  prescriptions:       'Prescriptions',
  advanced_reports:    'Advanced Reports',
  custom_integrations: 'Custom Integrations',
  priority_support:    'Priority Support',
}

/**
 * The canonical string stored in plan.features[] for each feature key.
 * This is what gets written to the database when admin selects a feature.
 */
export const FEATURE_CANONICAL: Record<FeatureKey, string> = {
  pos:                 'POS',
  inventory:           'Inventory',
  reports:             'Reports',
  insurance:           'Insurance',
  analytics:           'Analytics',
  multi_branch:        'Multi-Branch',
  staff_management:    'Staff Management',
  patients:            'Patients',
  prescriptions:       'Prescriptions',
  advanced_reports:    'Advanced Reports',
  custom_integrations: 'Custom Integrations',
  priority_support:    'Priority Support',
}

/** All valid canonical feature strings (lowercase for comparison). */
export const VALID_FEATURE_STRINGS: Set<string> = new Set(
  Object.values(FEATURE_CANONICAL).map(v => v.toLowerCase())
)

/**
 * Validate that every string in a features array maps to a known system feature.
 * Returns the list of invalid entries (empty array = all valid).
 */
export function validatePlanFeatures(features: string[]): string[] {
  return features.filter(f => !VALID_FEATURE_STRINGS.has(f.toLowerCase()))
}

/**
 * Route → feature key mapping.
 * Used by middleware and FeatureGate to auto-detect required feature.
 */
export const ROUTE_FEATURE_MAP: Record<string, FeatureKey> = {
  '/pos':           'pos',
  '/inventory':     'inventory',
  '/reports':       'reports',
  '/insurance':     'insurance',
  '/analytics':     'analytics',
  '/branches':      'multi_branch',
  '/staff':         'staff_management',
  '/patients':      'patients',
  '/prescriptions': 'prescriptions',
}
