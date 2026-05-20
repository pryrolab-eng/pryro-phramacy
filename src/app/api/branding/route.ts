import { NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

/**
 * Public endpoint — no auth required.
 * Returns the platform name and logo URL set by the superadmin.
 */
export async function GET() {
  try {
    const supabase = createClient()

    const { data: settings } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['platformName', 'platformLogoUrl'])
      .is('pharmacy_id', null)

    const map: Record<string, string> = {}
    settings?.forEach((s) => {
      map[s.setting_key] = s.setting_value
    })

    return NextResponse.json({
      platformName: map.platformName || 'Pryrox',
      platformLogoUrl: map.platformLogoUrl || null,
    })
  } catch {
    return NextResponse.json({ platformName: 'Pryrox', platformLogoUrl: null })
  }
}
