import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_global', true)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) {
      console.error('Categories fetch error:', error)
      return NextResponse.json([])
    }
    return NextResponse.json(categories || [])
  } catch (error) {
    console.error('Categories error:', error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const body = await request.json()
    
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name: body.name || body.categoryName,
        description: body.description || body.categoryDescription || '',
        is_global: true,
        pharmacy_id: null,
        is_active: true
      })
      .select()
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
