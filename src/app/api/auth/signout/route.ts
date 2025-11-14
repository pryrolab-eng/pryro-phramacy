import { createClient } from '../../../../../supabase/server'
import { redirect } from 'next/navigation'

export async function GET() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/sign-in')
}
