import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/get-auth-user'
import { AdminShell } from '@/components/admin/admin-shell'
import { SuperadminSidebar } from '@/components/superadmin-sidebar'
import { DashboardProviders } from '@/components/shell/dashboard-providers'
import { DashboardMainScroll } from '@/components/shell/dashboard-providers'
import { DashboardShellBar } from '@/components/shell/dashboard-shell-bar'
import { storeGetIsPlatformAdmin } from '@/lib/db/public-users-store'
import { BranchScopeProvider } from '@/hooks/useBranchScope'
import { AiSlideOverPanel } from '@/components/ai-panel'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthUser();
  if (!user) {
    redirect('/sign-in')
  }

  const isPlatformAdmin = await storeGetIsPlatformAdmin(user.id);
  if (!isPlatformAdmin) {
    redirect('/app')
  }

  return (
    <BranchScopeProvider>
      <DashboardProviders withPharmacyContext={false}>
        <AdminShell>
          <SuperadminSidebar />
        </AdminShell>
        <DashboardShellBar showBranchSwitcher={false} />
        <DashboardMainScroll className="min-w-0 flex-1">
          {children}
        </DashboardMainScroll>
        <AiSlideOverPanel />
      </DashboardProviders>
    </BranchScopeProvider>
  )
}