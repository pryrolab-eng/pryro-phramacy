import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: prescriptions, error } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) throw error
    
    // Format for frontend
    const formattedPrescriptions = prescriptions?.map(p => ({
      id: p.id,
      patient: p.patient_name,
      doctor: p.doctor_name,
      medications: p.medications,
      priority: p.priority,
      time: new Date(p.created_at).toLocaleTimeString(),
      insurance: p.insurance_provider || 'None'
    })) || []

    return NextResponse.json(formattedPrescriptions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { prescriptionId, action } = await request.json()
    
    if (action === 'dispense') {
      const { error } = await supabase
        .from('prescriptions')
        .update({ status: 'dispensed' })
        .eq('id', prescriptionId)

      if (error) throw error
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process prescription' }, { status: 500 })
  }
}