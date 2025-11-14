import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: prescriptions, error } = await supabase
      .from('prescriptions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Format data to match frontend expectations
    const formattedPrescriptions = prescriptions?.map(p => ({
      id: p.id,
      patient: p.patient_name,
      doctor: p.doctor_name,
      medications: p.medications,
      priority: p.priority,
      status: p.status,
      time: new Date(p.created_at).toLocaleTimeString(),
      insurance: p.insurance_provider || 'None',
      created_at: p.created_at
    })) || []

    return NextResponse.json(formattedPrescriptions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .insert({
        pharmacy_id: body.pharmacy_id || 'userPharmacy.pharmacy_id',
        patient_name: body.patient,
        doctor_name: body.doctor,
        medications: body.medications,
        priority: body.priority || 'medium',
        status: 'pending',
        insurance_provider: body.insurance || 'None',
        notes: body.notes
      })
      .select()
      .single()

    if (error) throw error
    
    return NextResponse.json({ success: true, prescription })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create prescription' }, { status: 500 })
  }
}
