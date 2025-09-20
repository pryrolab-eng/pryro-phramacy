import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's pharmacy
    const { data: pharmacyUser, error: pharmacyError } = await supabase
      .from('pharmacy_users')
      .select('pharmacy_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (pharmacyError || !pharmacyUser) {
      return NextResponse.json({ error: 'Pharmacy not found' }, { status: 404 })
    }

    // Get dashboard stats
    const { data: stats, error: statsError } = await supabase
      .from('pharmacy_dashboard_stats')
      .select('*')
      .eq('pharmacy_id', pharmacyUser.pharmacy_id)
      .single()

    if (statsError) {
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }

    // Get inventory alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('inventory_alerts')
      .select('*')
      .eq('pharmacy_id', pharmacyUser.pharmacy_id)
      .limit(10)

    if (alertsError) {
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    // Get recent sales
    const { data: recentSales, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        customer_name,
        total_amount,
        payment_method,
        created_at,
        sale_items (
          medication_name,
          quantity,
          total_price
        )
      `)
      .eq('pharmacy_id', pharmacyUser.pharmacy_id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (salesError) {
      return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
    }

    return NextResponse.json({
      stats,
      alerts,
      recentSales
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}