import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '../../../../../supabase/server'
import { resolveIsAppPlatformAdmin } from '@/lib/platform-admin'

/** Pharmacies that count as "active" for platform analytics (operating, not suspended/inactive). */
function isOperatingPharmacyStatus(status: string | null | undefined): boolean {
  return status === 'active' || status === 'trial'
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null)
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
    }

    // Fetch all settings
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .is('pharmacy_id', null)
      .order('setting_key', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      throw error
    }
    
    // Convert to expected format
    const systemSettings: Record<string, any> = {}
    
    settings?.forEach(setting => {
      systemSettings[setting.setting_key] = setting.setting_value
    })

    // Platform-wide counts (RLS would hide other tenants on the user-scoped client).
    // Pharmacies use `status`, not `is_active` (invalid column previously broke this query).
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let analytics = {
      active_pharmacies: 0,
      total_users: 0,
      total_pharmacies: 0,
      new_users_30d: 0,
    }

    if (url && serviceKey) {
      const adminDb = createServiceClient(url, serviceKey)
      const { data: pharmacies, error: pharmaciesError } = await adminDb
        .from('pharmacies')
        .select('id, status')

      const { data: users, error: usersError } = await adminDb
        .from('users')
        .select('id, created_at')

      if (pharmaciesError) console.error('Analytics pharmacies query:', pharmaciesError)
      if (usersError) console.error('Analytics users query:', usersError)

      const pharmacyRows = pharmacies ?? []
      const userRows = users ?? []
      const cutoffMs = Date.now() - 30 * 24 * 60 * 60 * 1000

      analytics = {
        active_pharmacies: pharmacyRows.filter((p) =>
          isOperatingPharmacyStatus(p.status),
        ).length,
        total_pharmacies: pharmacyRows.length,
        total_users: userRows.length,
        new_users_30d: userRows.filter(
          (u) => u.created_at && new Date(u.created_at).getTime() > cutoffMs,
        ).length,
      }
    } else {
      console.error(
        'SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL missing; analytics not computed',
      )
    }

    return NextResponse.json({
      settings: systemSettings,
      analytics,
    })
  } catch (error: any) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch settings',
      details: error.message 
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await resolveIsAppPlatformAdmin(supabase, user.id, null)
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden: Super admin access required' }, { status: 403 })
    }

    const updates = await request.json()
    
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    // Update or insert each setting
    const results = []
    for (const [key, value] of Object.entries(updates)) {
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('setting_key', key)
        .is('pharmacy_id', null)
        .maybeSingle()
      
      if (existing) {
        const result = await supabase
          .from('system_settings')
          .update({ setting_value: value, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
        results.push(result)
      } else {
        const result = await supabase
          .from('system_settings')
          .insert({ setting_key: key, setting_value: value, pharmacy_id: null })
        results.push(result)
      }
    }

    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Upsert errors:', errors)
      return NextResponse.json({ 
        error: 'Some settings failed to save',
        details: errors 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully',
      updated: Object.keys(updates).length
    })
  } catch (error: any) {
    console.error('Failed to update settings:', error)
    return NextResponse.json({ 
      error: 'Failed to update settings',
      details: error.message 
    }, { status: 500 })
  }
}
