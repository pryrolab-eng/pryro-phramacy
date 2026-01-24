import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { sessionToken } = await request.json()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async getAll() {
            return (await cookies()).getAll()
          },
          async setAll(cookiesToSet) {
            cookiesToSet.forEach(async ({ name, value, options }) => {
              (await cookies()).set(name, value, options)
            })
          },
        },
      }
    )

    // Check if session is verified
    const { data: session } = await supabase
      .from('two_factor_sessions')
      .select('user_id, verified')
      .eq('session_token', sessionToken)
      .eq('verified', true)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Not verified' }, { status: 400 })
    }

    // Get user
    const { data: { user } } = await supabase.auth.admin.getUserById(session.user_id)
    
    if (!user || !user.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 })
    }

    // Generate OTP for the user
    const { data: otpData, error: otpError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    })

    if (otpError || !otpData) {
      console.error('OTP generation error:', otpError)
      return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
    }

    // Extract the token from the action link
    const url = new URL(otpData.properties.action_link)
    const token = url.searchParams.get('token')
    const type = url.searchParams.get('type')

    return NextResponse.json({ 
      success: true,
      token,
      type
    })
  } catch (error) {
    console.error('Complete 2FA error:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
