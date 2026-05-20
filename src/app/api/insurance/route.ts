import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '../../../../supabase/server'
import { resolveIsAppPlatformAdmin } from '@/lib/platform-admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If no user, return only global active insurance providers
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
      // Service role avoids RLS policies that still reference auth.users on some DBs
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
    
    // Regular users see their pharmacy's insurance providers + global ones
    const { data: userPharmacy, error: pharmacyError } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()
    
    if (pharmacyError || !userPharmacy) {
      console.error('Error fetching user pharmacy:', pharmacyError)
      return NextResponse.json([])
    }
    
    const { data: providers, error } = await supabase
      .from('insurance_providers')
      .select('*')
      .or(`pharmacy_id.eq.${userPharmacy.pharmacy_id},pharmacy_id.is.null`)
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
    
    console.log('🔍 User email:', user?.email)
    
    if (!user || authError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Please login' 
      }, { status: 401 })
    }
    
    const isSuperAdmin = await resolveIsAppPlatformAdmin(supabase, user.id, null)
    console.log('🔍 isSuperAdmin:', isSuperAdmin)
    
    // Use service role for superadmin to bypass RLS
    const dbClient = isSuperAdmin 
      ? createServiceClient()
      : supabase
    console.log('🔍 Using service role:', isSuperAdmin)
    
    let pharmacyId = null
    
    if (!isSuperAdmin) {
      const { data: userPharmacy, error: pharmacyError } = await supabase
        .from('pharmacy_users')
        .select('pharmacy_id, role')
        .eq('user_id', user.id)
        .maybeSingle()
      
      console.log('🔍 userPharmacy:', userPharmacy)
      
      if (pharmacyError) {
        return NextResponse.json({ 
          success: false, 
          error: 'Database error checking permissions' 
        }, { status: 500 })
      }
      
      if (!userPharmacy) {
        return NextResponse.json({ 
          success: false, 
          error: 'User not associated with any pharmacy' 
        }, { status: 403 })
      }
      
      if (!['pharmacy_owner', 'admin'].includes(userPharmacy.role)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Insufficient permissions' 
        }, { status: 403 })
      }
      
      pharmacyId = userPharmacy.pharmacy_id
    }
    console.log('🔍 Final pharmacyId:', pharmacyId)
    // For superadmin, pharmacy_id remains null (global insurance provider)
    
    // Validate required fields
    if (!body.name || !body.coverage_percentage) {
      return NextResponse.json({ 
        success: false, 
        error: 'Name and coverage percentage are required' 
      }, { status: 400 })
    }
    
    const insuranceData = {
      pharmacy_id: pharmacyId,
      name: body.name.trim(),
      coverage_percentage: parseFloat(body.coverage_percentage),
      contact_email: body.contact_email?.trim() || null,
      contact_phone: body.contact_phone?.trim() || null,
      policy_number: body.policy_number?.trim() || null,
      invoice_template: body.invoice_template || 'default',
      template_config: body.template_config || {},
      is_active: true
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
        error: `Database error: ${error.message}` 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      insurance: newInsurance,
      message: 'Insurance provider added successfully'
    })
  } catch (error) {
    console.error('Insurance add error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add insurance'
    }, { status: 500 })
  }
}
