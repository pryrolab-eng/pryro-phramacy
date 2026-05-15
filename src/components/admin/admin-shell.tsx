import type { ReactNode } from 'react'

import { SidebarTrigger } from '@/components/ui/sidebar'

/** Wraps all /admin routes with a consistent sidebar collapse control. */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
        <SidebarTrigger />
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}
