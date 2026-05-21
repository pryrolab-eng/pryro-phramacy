import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '../../../../../../supabase/server'
import { resolveIsAppPlatformAdmin } from '@/lib/platform-admin'
import { VALID_FEATURE_STRINGS, FEATURE_CANONICAL } from '@/lib/saas/feature-access'

/**
 * POST /api/admin/plans/cleanup-features
 *
 * Scans every active subscription plan and removes any feature strings
 * that don't match a known system feature (case-insensitive).
 * Also normalises surviving strings to their canonical form.
 *
 * Returns: { updated: number, plans: { id, name, removed: string[], kept: string[] }[] }
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null)
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: platform admin access required' },
        { status: 403 }
      )
    }

    const db = createServiceClient()

    const { data: plans, error: fetchError } = await db
      .from('subscription_plans')
      .select('id, name, features')

    if (fetchError) throw fetchError

    // Build a reverse map: lowercase canonical → canonical (for normalisation)
    const canonicalMap = new Map<string, string>(
      Object.values(FEATURE_CANONICAL).map(v => [v.toLowerCase(), v])
    )

    const results: { id: string; name: string; removed: string[]; kept: string[] }[] = []
    let updated = 0

    for (const plan of plans ?? []) {
      const raw: string[] = Array.isArray(plan.features)
        ? plan.features.map(String)
        : typeof plan.features === 'string'
          ? (plan.features as string).split(',').map((f: string) => f.trim()).filter(Boolean)
          : []

      const kept: string[] = []
      const removed: string[] = []

      for (const f of raw) {
        const lower = f.toLowerCase()
        if (VALID_FEATURE_STRINGS.has(lower)) {
          // Normalise to canonical casing
          kept.push(canonicalMap.get(lower) ?? f)
        } else {
          removed.push(f)
        }
      }

      // Only update if something changed
      const changed =
        removed.length > 0 ||
        raw.some((f, i) => f !== kept[i]) // casing normalised

      if (changed) {
        const { error: updateError } = await db
          .from('subscription_plans')
          .update({ features: kept })
          .eq('id', plan.id)

        if (updateError) {
          console.error(`cleanup-features: failed to update plan ${plan.id}`, updateError)
          continue
        }
        updated++
      }

      if (removed.length > 0 || changed) {
        results.push({ id: plan.id, name: plan.name, removed, kept })
      }
    }

    return NextResponse.json({ success: true, updated, plans: results })
  } catch (error) {
    console.error('POST /api/admin/plans/cleanup-features', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clean up features' },
      { status: 500 }
    )
  }
}
