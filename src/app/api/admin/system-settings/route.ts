import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('pharmacy_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')

    if (error) throw error
    
    // Convert to expected format
    const systemSettings = {
      pharmacy: {},
      business: {},
      notifications: {}
    }
    
    settings?.forEach(setting => {
      systemSettings[setting.setting_key] = setting.setting_value
    })

    return NextResponse.json(systemSettings)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const updates = await request.json()
    
    // Update each setting category
    for (const [key, value] of Object.entries(updates)) {
      await supabase
        .from('system_settings')
        .upsert({
          pharmacy_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          setting_key: key,
          setting_value: value
        })
    }

    return NextResponse.json({ success: true, settings: updates })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}