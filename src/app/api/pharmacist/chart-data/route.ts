import { NextResponse } from 'next/server'
import { createClient } from '../../../../../supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get today's sales by hour
    const today = new Date().toISOString().split('T')[0]
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('created_at')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)
    
    if (salesError) throw salesError
    
    // Get today's prescriptions by hour
    const { data: prescriptions, error: prescError } = await supabase
      .from('prescriptions')
      .select('created_at')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)
    
    if (prescError) throw prescError
    
    // Group by hour
    const chartData = []
    for (let hour = 9; hour <= 17; hour++) {
      const hourStr = `${hour}:00`
      const salesCount = sales?.filter(s => 
        new Date(s.created_at).getHours() === hour
      ).length || 0
      
      const prescCount = prescriptions?.filter(p => 
        new Date(p.created_at).getHours() === hour
      ).length || 0
      
      chartData.push({
        time: hourStr,
        prescriptions: prescCount,
        customers: salesCount
      })
    }

    return NextResponse.json(chartData)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 })
  }
}