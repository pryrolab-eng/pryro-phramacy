import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userPharmacy } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .single()

    if (!userPharmacy) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const fileName = `${userPharmacy.pharmacy_id}-${Date.now()}.${file.name.split('.').pop()}`
    
    const { data, error } = await supabase.storage
      .from('pharmacy-logos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('pharmacy-logos')
      .getPublicUrl(fileName)

    return NextResponse.json({ 
      success: true, 
      url: publicUrl 
    })
  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 })
  }
}
