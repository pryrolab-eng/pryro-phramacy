import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import { listCategoryCatalog } from '@/lib/pharmacy/category-catalog'
import { createServiceClient } from '../../../../supabase/service'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)
    const admin = createServiceClient()
    const categories = await listCategoryCatalog(admin, pharmacyId)
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Categories error:', error)
    const message =
      error instanceof Error ? error.message : 'Failed to load categories'
    const status = message.includes('Pharmacy not found') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)
    const name = String(body.name || body.categoryName || '').trim()
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 },
      )
    }

    const admin = createServiceClient()
    const { data: category, error } = await admin
      .from('categories')
      .insert({
        pharmacy_id: pharmacyId,
        name,
        description: body.description || body.categoryDescription || '',
        is_active: true,
      })
      .select('id, name, description, is_active, pharmacy_id')
      .single()

    if (error) {
      console.error('Category insert error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, category })
  } catch (error) {
    console.error('Category add error:', error)
    return NextResponse.json({ success: false, error: 'Failed to add category' }, { status: 500 })
  }
}
