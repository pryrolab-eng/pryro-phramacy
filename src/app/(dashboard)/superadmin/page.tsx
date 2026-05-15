import { redirect } from 'next/navigation'

/** Legacy route — platform dashboard lives at /admin */
export default function SuperadminRedirectPage() {
  redirect('/admin')
}
