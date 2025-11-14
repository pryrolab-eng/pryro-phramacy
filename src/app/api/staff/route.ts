import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get pharmacy users with auth user details
    const { data: pharmacyUsers, error } = await supabase
      .from('pharmacy_users')
      .select(`
        id,
        role,
        is_active,
        created_at,
        user_id
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Get user details from auth.users for each pharmacy user
    const formattedStaff = []
    for (const user of pharmacyUsers || []) {
      const { data: authUser } = await supabase.auth.admin.getUserById(user.user_id)
      if (authUser.user) {
        formattedStaff.push({
          id: user.id,
          name: authUser.user.user_metadata?.full_name || authUser.user.email?.split('@')[0] || 'Unknown',
          email: authUser.user.email,
          phone: authUser.user.user_metadata?.phone || 'N/A',
          role: user.role,
          status: user.is_active ? 'active' : 'inactive',
          joinDate: new Date(user.created_at).toLocaleDateString()
        })
      }
    }

    return NextResponse.json(formattedStaff)
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const body = await request.json()
    
    // This would create a new pharmacy user - but we're using /api/pharmacist for that
    return NextResponse.json({ success: false, error: 'Use /api/pharmacist to create staff' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to create staff member' }, { status: 500 })
  }
}
