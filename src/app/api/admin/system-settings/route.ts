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
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Fetch all settings
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('category', { ascending: true })

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
    const { data: analytics } = await supabase
      .from('admin_analytics')
      .select('*')
      .single()

    return NextResponse.json({ 
      settings: systemSettings,
      analytics: analytics || {
        active_pharmacies: 0,
        total_users: 0,
        total_pharmacies: 0,
        new_users_30d: 0
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
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || userData?.role !== 'superadmin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const updates = await request.json()
    
    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    
    // Update each setting
    const updatePromises = Object.entries(updates).map(([key, value]) => 
      supabase
        .from('system_settings')
        .update({ setting_value: value })
        .eq('setting_key', key)
    )

    const results = await Promise.all(updatePromises)
    
    // Check for errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Update errors:', errors)
      return NextResponse.json({ 
        error: 'Some settings failed to update',
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
