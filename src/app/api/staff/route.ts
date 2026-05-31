import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '../../../../supabase/server'
import { createClient } from '@supabase/supabase-js'
import { requireSessionPharmacyId } from '@/lib/pharmacy/get-session-pharmacy'
import {
  permissionErrorResponse,
  requirePharmacyPermission,
} from '@/lib/rbac/require-pharmacy-permission'
import { PHARMACY_PERMISSIONS } from '@/lib/rbac/permissions'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await requirePharmacyPermission(user.id, PHARMACY_PERMISSIONS.staffManage)

    const pharmacyId = await requireSessionPharmacyId(supabase, user.id)

    // Use service role to get staff details
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get pharmacy users ONLY for current pharmacy
    const { data: pharmacyUsers, error } = await serviceSupabase
      .from('pharmacy_users')
      .select(`
        id,
        role,
        is_active,
        created_at,
        user_id
      `)
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Get user details from auth.users for each pharmacy user
    const formattedStaff = []
    for (const user of pharmacyUsers || []) {
      const { data: authUser } = await serviceSupabase.auth.admin.getUserById(user.user_id)
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
    const forbidden = permissionErrorResponse(error)
    if (forbidden) {
      return NextResponse.json(forbidden.body, { status: forbidden.status })
    }
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
