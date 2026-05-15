/**
 * Pick one pharmacy_users row when a user has several (e.g. legacy migration
 * `aaaaaaaa-...` plus seed trigger `11111111-...`).
 */
export type PharmacyMembership = {
  pharmacy_id: string | null
  role: string
}

const DEMO_PHARMACY_ID = '11111111-1111-1111-1111-111111111111'

export function selectPrimaryMembership(
  rows: PharmacyMembership[] | null | undefined
): PharmacyMembership | null {
  if (!rows?.length) return null
  const platform = rows.find(
    (r) => r.role === 'admin' || r.role === 'superadmin'
  )
  if (platform) return platform
  const demo = rows.find((r) => r.pharmacy_id === DEMO_PHARMACY_ID)
  if (demo) return demo
  return rows[0]
}
