import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '../../../../supabase/server'
import { resolveIsAppPlatformAdmin } from '@/lib/platform-admin'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { resolveActivePharmacyContext } from '@/lib/pharmacy/active-pharmacy'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      const { data: providers, error } = await supabase
        .from('insurance_providers')
        .select('*')
        .is('pharmacy_id', null)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching global insurance:', error)
        return NextResponse.json([])
      }
      return NextResponse.json(providers || [])
    }

    const isSuperAdmin = await resolveIsAppPlatformAdmin(supabase, user.id, null)

    if (isSuperAdmin) {
      const admin = createServiceClient()
      const { data: providers, error } = await admin
        .from('insurance_providers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching all insurance:', error)
        return NextResponse.json([])
      }
      return NextResponse.json(providers || [])
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const { data: providers, error } = await supabase
      .from('insurance_providers')
      .select('*')
      .or(`pharmacy_id.eq.${pharmacyId},pharmacy_id.is.null`)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching pharmacy insurance:', error)
      return NextResponse.json([])
    }

    return NextResponse.json(providers || [])
  } catch (error) {
    console.error('Insurance fetch error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (!user || authError) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - Please login',
      }, { status: 401 })
    }

    const isSuperAdmin = await resolveIsAppPlatformAdmin(supabase, user.id, null)
    const dbClient = isSuperAdmin ? createServiceClient() : supabase

    let pharmacyId: string | null = null

    if (!isSuperAdmin) {
      const admin = createServiceClient()
      const ctx = await resolveActivePharmacyContext(admin, user.id)

      if (!ctx.activePharmacyId) {
        return NextResponse.json({
          success: false,
          error: 'User not associated with any pharmacy',
        }, { status: 403 })
      }

      if (!['pharmacy_owner', 'admin'].includes(ctx.role ?? '')) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient permissions',
        }, { status: 403 })
      }

      pharmacyId = ctx.activePharmacyId
    }

    if (!body.name || !body.coverage_percentage) {
      return NextResponse.json({
        success: false,
        error: 'Name and coverage percentage are required',
      }, { status: 400 })
    }

    const coveragePct = parseFloat(body.coverage_percentage)
    const insuranceData = {
      pharmacy_id: pharmacyId,
      name: body.name.trim(),
      coverage_percentage: coveragePct,
      default_coverage_percent: coveragePct,
      contact_email: body.contact_email?.trim() || null,
      contact_phone: body.contact_phone?.trim() || null,
      policy_number: body.policy_number?.trim() || null,
      invoice_template: body.invoice_template || 'default',
      template_config: body.template_config || {},
      is_active: true,
    }

    const { data: newInsurance, error } = await dbClient
      .from('insurance_providers')
      .insert(insuranceData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: `Database error: ${error.message}`,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      insurance: newInsurance,
      message: 'Insurance provider added successfully',
    })
  } catch (error) {
    console.error('Insurance add error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add insurance',
    }, { status: 500 })
  }
}
