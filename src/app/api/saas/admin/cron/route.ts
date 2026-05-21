// POST /api/saas/admin/cron  (manual trigger by admin or external scheduler)
// GET  /api/saas/admin/cron  (Vercel Cron — runs daily at 06:00 UTC)
//
// Runs all subscription lifecycle jobs:
//   1. Expire + suspend overdue subscriptions
//   2. Send expiry warning emails (7d, 3d, 1d)
//   3. Send usage warning emails (75%, 90%, 100%)
//   4. Reset monthly branch usage (only on 1st of month)
//
// Secure with CRON_SECRET env var. Vercel Cron sends the secret
// automatically via the Authorization header.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'
import { createServiceClient } from '../../../../../../supabase/service'
import {
  runExpiryCheck,
  runExpiryWarnings,
  runUsageWarnings,
  runMonthlyUsageReset,
} from '@/lib/saas/subscription-lifecycle'

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET

  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true

  // Legacy x-cron-secret header
  const legacyHeader = request.headers.get('x-cron-secret')
  if (cronSecret && legacyHeader === cronSecret) return true

  // Fall back to session-based auth for manual admin triggers
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('is_platform_admin')
        .eq('id', user.id)
        .maybeSingle()
      if (profile?.is_platform_admin) return true
    }
  } catch { /* not authenticated */ }

  return false
}

async function runJobs(requestedJobs: string[]) {
  const admin = createServiceClient()
  const today = new Date()
  const isFirstOfMonth = today.getDate() === 1
  const results: Record<string, unknown> = {}

  if (requestedJobs.includes('expiry')) {
    try { results.expiry = await runExpiryCheck(admin) }
    catch (e) { results.expiry = { error: e instanceof Error ? e.message : String(e) } }
  }

  if (requestedJobs.includes('warnings')) {
    try { results.warnings = await runExpiryWarnings(admin) }
    catch (e) { results.warnings = { error: e instanceof Error ? e.message : String(e) } }
  }

  if (requestedJobs.includes('usage_warnings')) {
    try { results.usage_warnings = await runUsageWarnings(admin) }
    catch (e) { results.usage_warnings = { error: e instanceof Error ? e.message : String(e) } }
  }

  if (requestedJobs.includes('reset')) {
    if (isFirstOfMonth || requestedJobs.includes('force_reset')) {
      try { results.reset = await runMonthlyUsageReset(admin) }
      catch (e) { results.reset = { error: e instanceof Error ? e.message : String(e) } }
    } else {
      results.reset = { skipped: true, reason: 'Not the 1st of the month. Pass force_reset to override.' }
    }
  }

  return results
}

// Vercel Cron uses GET
export async function GET(request: NextRequest) {
  if (!await isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const results = await runJobs(['expiry', 'warnings', 'usage_warnings', 'reset'])
  return NextResponse.json({ ok: true, ran_at: new Date().toISOString(), results })
}

// Manual admin trigger uses POST
export async function POST(request: NextRequest) {
  if (!await isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await request.json().catch(() => ({})) as { jobs?: string[] }
  const requestedJobs = body.jobs ?? ['expiry', 'warnings', 'usage_warnings', 'reset']
  const results = await runJobs(requestedJobs)
  return NextResponse.json({ ok: true, ran_at: new Date().toISOString(), results })
}
