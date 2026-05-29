import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    
    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    const insuranceData = {
      pharmacy_id: pharmacyId,
      name: body.insuranceName || '',
      coverage_percentage: parseFloat(body.coveragePercentage) || 0,
      is_active: true
    }
    
    const { data: newInsurance, error } = await supabase
      .from('insurance_providers')
      .insert(insuranceData)
      .select()
      .single()
    
    if (error) {
      console.error('Database error:', error)
      throw error
    }
    
    return NextResponse.json({ 
      success: true, 
      insurance: {
        id: newInsurance.id,
        name: newInsurance.name,
        coverage_percentage: newInsurance.coverage_percentage
      }
    })
  } catch (error) {
    console.error('Quick add insurance error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to add insurance'
    }, { status: 500 })
  }
}
