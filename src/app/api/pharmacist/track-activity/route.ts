import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { type, data } = await request.json()
    
    switch (type) {
      case 'prescription_start':
        await supabase
          .from('prescription_processing')
          .insert({
            prescription_id: data.prescriptionId,
            started_at: new Date().toISOString()
          })
        break
        
      case 'prescription_complete':
        await supabase
          .from('prescription_processing')
          .update({ completed_at: new Date().toISOString() })
          .eq('prescription_id', data.prescriptionId)
          .is('completed_at', null)
        break
        
      case 'inventory_check':
        await supabase
          .from('inventory_checks')
          .insert({
            inventory_id: data.inventoryId,
            check_type: data.checkType || 'routine',
            notes: data.notes
          })
        break
        
      case 'alert_action':
        await supabase
          .from('alert_actions')
          .insert({
            alert_type: data.alertType,
            alert_reference_id: data.referenceId,
            action_taken: data.action,
            notes: data.notes
          })
        break
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track activity' }, { status: 500 })
  }
}
