import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Quick add insurance data:', body)
    
    // For now, just return success with mock data
    const newInsurance = {
      id: Date.now().toString(),
      name: body.insuranceName || body.name || 'New Insurance',
      coverage_percentage: parseInt(body.coveragePercentage) || 80,
      is_active: true
    }
    
    return NextResponse.json({ 
      success: true, 
      insurance: newInsurance,
      message: 'Insurance provider added successfully'
    })
  } catch (error) {
    console.error('Quick add insurance error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add insurance provider',
      details: error.message 
    }, { status: 500 })
  }
}