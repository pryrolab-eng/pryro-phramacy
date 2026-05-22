// PATCH /api/saas/branches/[id]  — update branch details (owner/admin only)
// DELETE /api/saas/branches/[id] — soft-delete branch (owner/admin only)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'
import { createServiceClient } from '../../../../../../supabase/service'

async function resolvePharmacyMembership(userId: string) {
  const admin = createServiceClient()
  const { data } = await admin
    .from('pharmacy_users')
    .select('pharmacy_id, role')
    .eq('user_id', userId)
    .eq('is_active', true)
    .in('role', ['pharmacy_owner', 'admin'])
    .limit(1)
    .maybeSingle()
  return data
}

async function resolveBranch(branchId: string, pharmacyId: string) {
  const admin = createServiceClient()
  const { data } = await admin
    .from('branches')
    .select('id, pharmacy_id, is_active')
    .eq('id', branchId)
    .eq('pharmacy_id', pharmacyId)
    .maybeSingle()
  return data
}

// ─── PATCH — edit branch ───────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const membership = await resolvePharmacyMembership(user.id)
    if (!membership?.pharmacy_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const branch = await resolveBranch(id, membership.pharmacy_id)
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    const body = await request.json()
    const { name, address, phone, email } = body

    if (name !== undefined && !String(name).trim()) {
      return NextResponse.json({ error: 'Branch name cannot be empty' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (name !== undefined)    updates.name    = String(name).trim()
    if (address !== undefined) updates.address = address || null
    if (phone !== undefined)   updates.phone   = phone || null
    if (email !== undefined)   updates.email   = email || null

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const admin = createServiceClient()
    const { data: updated, error } = await admin
      .from('branches')
      .update(updates)
      .eq('id', id)
      .eq('pharmacy_id', membership.pharmacy_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ branch: updated })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update branch'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ─── DELETE — soft-delete branch ──────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const membership = await resolvePharmacyMembership(user.id)
    if (!membership?.pharmacy_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const branch = await resolveBranch(id, membership.pharmacy_id)
    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 })
    }

    const admin = createServiceClient()
    const { error } = await admin
      .from('branches')
      .update({ is_active: false })
      .eq('id', id)
      .eq('pharmacy_id', membership.pharmacy_id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to delete branch'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
