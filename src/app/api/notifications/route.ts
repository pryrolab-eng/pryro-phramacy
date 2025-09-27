import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    
    // Format for frontend compatibility
    const formattedNotifications = notifications?.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.is_read,
      date: n.created_at
    })) || []

    return NextResponse.json(formattedNotifications)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        pharmacy_id: body.pharmacy_id || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        title: body.title,
        message: body.message,
        type: body.type || 'info',
        is_read: false
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, notification })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}