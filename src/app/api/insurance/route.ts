import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Return default insurance providers for testing
    const defaultProviders = [
      { id: '1', name: 'RSSB', coverage_percentage: 90, is_active: true },
      { id: '2', name: 'MMI', coverage_percentage: 85, is_active: true },
      { id: '3', name: 'RAMA', coverage_percentage: 100, is_active: true },
      { id: '4', name: 'Radiant', coverage_percentage: 80, is_active: true }
    ]
    
    return NextResponse.json(defaultProviders)
  } catch (error) {
    console.error('GET /api/insurance error:', error)
    return NextResponse.json([
      { id: '1', name: 'RSSB', coverage_percentage: 90, is_active: true },
      { id: '2', name: 'MMI', coverage_percentage: 85, is_active: true }
    ])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({ 
      success: true, 
      provider: {
        id: Date.now().toString(),
        name: body.name,
        coverage_percentage: body.coverage_percentage || 80,
        is_active: true
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add insurance provider' 
    }, { status: 500 })
  }
}