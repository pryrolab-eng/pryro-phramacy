import type { ReactNode } from 'react'

/** Wraps /admin routes — scroll header lives in DashboardShellBar at layout level. */
export function AdminShell({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>
}
