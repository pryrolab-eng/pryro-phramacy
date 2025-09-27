import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data: prescription, error } = await supabase
      .from('prescriptions')
      .update({
        patient_name: body.patient,
        doctor_name: body.doctor,
        medications: body.medications,
        priority: body.priority,
        status: body.status,
        insurance_provider: body.insurance,
        notes: body.notes
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, prescription })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('prescriptions')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete prescription' }, { status: 500 })
  }
}