import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory store for notifications
let notifications: any[] = []

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const notification = {
      ...body,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    }
    
    notifications.push(notification)
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications = notifications.slice(-50)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to broadcast notification' }, { status: 500 })
  }
}

export async function GET() {
  const recentNotifications = notifications.slice(-10)
  return NextResponse.json(recentNotifications)
}
