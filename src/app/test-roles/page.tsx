import DatabaseRoleChecker from '@/components/database-role-checker'
import TestSidebar from '@/components/test-sidebar'
import LiveSidebarTest from '@/components/live-sidebar-test'

export default function TestRolesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">Role Testing & Database Verification</h1>
        
        <LiveSidebarTest />
        <DatabaseRoleChecker />
        <TestSidebar />
        
        <div className="text-center text-sm text-gray-600">
          <p>Navigate to <code>/test-roles</code> to access this page</p>
        </div>
      </div>
    </div>
  )
}