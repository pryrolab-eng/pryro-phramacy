import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAuthClient, createServiceClient } from '../../../../../../../../supabase/server'
import { resolveIsAppPlatformAdmin } from '@/lib/platform-admin'
import { uploadAndPersistPharmacyLogo } from '@/lib/pharmacy/upload-pharmacy-logo'

type RouteParams = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await createAuthClient()
    const {
      data: { user },
    } = await auth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowed = await resolveIsAppPlatformAdmin(auth, user.id, null)
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: pharmacyId } = await params
    const admin = createServiceClient()
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const publicUrl = await uploadAndPersistPharmacyLogo(admin, pharmacyId, file)

    return NextResponse.json({ success: true, url: publicUrl })
  } catch (error) {
    console.error('Admin logo upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload logo' },
      { status: 500 },
    )
  }
}
