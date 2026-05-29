import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAuthClient, createServiceClient } from '../../../../../../../supabase/server'
import { resolveIsAppPlatformAdmin } from '@/lib/platform-admin'
import {
  loadPharmacyBrandingRow,
  savePharmacyBrandingRow,
} from '@/lib/pharmacy/branding-db'

type RouteParams = { params: Promise<{ id: string }> }

async function assertPlatformAdmin() {
  const auth = await createAuthClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  const allowed = await resolveIsAppPlatformAdmin(auth, user.id, null)
  if (!allowed) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { admin: createServiceClient() }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const ctx = await assertPlatformAdmin()
  if ('error' in ctx && ctx.error) return ctx.error

  const { id } = await params
  try {
    const branding = await loadPharmacyBrandingRow(ctx.admin, id)
    if (!branding) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 })
    }
    return NextResponse.json(branding)
  } catch (e) {
    console.error('GET admin pharmacy branding', e)
    return NextResponse.json({ error: 'Failed to load branding' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const ctx = await assertPlatformAdmin()
  if ('error' in ctx && ctx.error) return ctx.error

  const { id } = await params
  try {
    const body = await request.json()
    await savePharmacyBrandingRow(ctx.admin, id, body)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('PUT admin pharmacy branding', e)
    return NextResponse.json({ error: 'Failed to update branding' }, { status: 500 })
  }
}
