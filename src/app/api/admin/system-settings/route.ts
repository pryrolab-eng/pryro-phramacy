import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is superadmin
    const { data: userData, error: userError } = await supabase
      .from('pharmacy_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userError || userData?.role !== 'superadmin') {
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

    // Fetch analytics
    const { data: pharmacies } = await supabase
      .from('pharmacies')
      .select('id, is_active')
    
    const { data: users } = await supabase
      .from('users')
      .select('id, created_at')
    
    const activePharmacies = pharmacies?.filter(p => p.is_active).length || 0
    const totalUsers = users?.length || 0
    const newUsers30d = users?.filter(u => 
      new Date(u.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length || 0

    return NextResponse.json({ 
      settings: systemSettings,
      analytics: {
        active_pharmacies: activePharmacies,
        total_users: totalUsers,
        total_pharmacies: pharmacies?.length || 0,
        new_users_30d: newUsers30d
      }
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

    // Check if user is superadmin
    const { data: userData, error: userError } = await supabase
      .from('pharmacy_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userError || userData?.role !== 'superadmin') {
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
