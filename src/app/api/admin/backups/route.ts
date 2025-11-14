import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: backups, error } = await supabase
      .from('backups')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Format for frontend compatibility
    const formattedBackups = backups?.map(b => ({
      id: b.id,
      name: b.name,
      size: b.file_size,
      date: b.created_at,
      status: b.status
    })) || []

    return NextResponse.json(formattedBackups)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch backups' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { type } = await request.json()
    
    const { data: backup, error } = await supabase
      .from('backups')
      .insert({
        pharmacy_id: 'userPharmacy.pharmacy_id',
        name: `${type} Backup - ${new Date().toLocaleDateString()}`,
        type: type,
        file_size: '2.5 MB',
        status: 'completed'
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, backup })
  } catch (error) {
    return NextResponse.json({ error: 'Backup failed' }, { status: 500 })
  }
}
