import { NextResponse } from 'next/server'
import { createClient } from '../../../../supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  // Also check session
  const { data: { session } } = await supabase.auth.getSession()
  
  return NextResponse.json({
    user: user ? {
      id: user.id,
      email: user.email,
      isSuperAdmin: user.email === 'abdousentore@gmail.com'
    } : null,
    hasSession: !!session,
    error: error?.message
  })
}
