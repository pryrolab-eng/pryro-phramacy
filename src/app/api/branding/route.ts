import { NextResponse } from 'next/server'
import { createServiceClient } from '../../../../supabase/service'
import { DEFAULT_PLATFORM_SUPPORT_EMAIL, normalizeSupportEmail } from '@/lib/platform/support-email'

const PUBLIC_SETTING_KEYS = [
  'platformName',
  'platformLogoUrl',
  'supportEmail',
] as const

/**
 * Public endpoint — no auth required.
 * Returns platform branding and support contact from global system_settings.
 */
export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data: settings } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [...PUBLIC_SETTING_KEYS])
      .is('pharmacy_id', null)

    const map: Record<string, string> = {}
    settings?.forEach((s) => {
      map[s.setting_key] = String(s.setting_value ?? '')
    })

    return NextResponse.json({
      platformName: map.platformName || 'Pryrox',
      platformLogoUrl: map.platformLogoUrl || null,
      supportEmail: normalizeSupportEmail(map.supportEmail),
    })
  } catch {
    return NextResponse.json({
      platformName: 'Pryrox',
      platformLogoUrl: null,
      supportEmail: DEFAULT_PLATFORM_SUPPORT_EMAIL,
    })
  }
}
