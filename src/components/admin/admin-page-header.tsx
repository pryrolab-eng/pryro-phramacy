'use client'

import { isValidElement, useEffect, useRef, type ReactNode } from 'react'

import { useDashboardScrollHeader } from '@/components/shell/dashboard-scroll-header-context'
import { dashboardText } from '@/components/dashboard/dashboard-tokens'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'

type AdminPageHeaderProps = {
  title: ReactNode
  /** Sticky bar label when title is not a plain string. */
  pinTitle?: string
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

function resolvePinTitle(title: ReactNode, pinTitle?: string): string {
  if (pinTitle) return pinTitle
  if (typeof title === 'string') return title
  if (isValidElement<{ children?: ReactNode }>(title)) {
    const child = title.props.children
    if (typeof child === 'string') return child
  }
  return 'Page'
}

function renderTitle(title: ReactNode) {
  if (typeof title === 'string') {
    return <h1 className={dashboardText.title}>{title}</h1>
  }
  if (isValidElement(title) && title.type === 'h1') {
    return title
  }
  return title
}

/** Admin page title row — pins into DashboardShellBar on scroll. */
export function AdminPageHeader({
  title,
  pinTitle,
  description,
  actions,
  className,
}: AdminPageHeaderProps) {
  const { isPinned, setHeaderConfig, registerSentinel } =
    useDashboardScrollHeader()
  const resolvedPinTitle = resolvePinTitle(title, pinTitle)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHeaderConfig({ title: resolvedPinTitle })
    return () => setHeaderConfig(null)
  }, [resolvedPinTitle, setHeaderConfig])

  useEffect(() => {
    registerSentinel(sentinelRef.current)
    return () => registerSentinel(null)
  }, [registerSentinel])

  return (
    <div className={cn('relative', className)}>
      <motion.div
        initial={false}
        animate={{ opacity: isPinned ? 0 : 1 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
          isPinned && 'pointer-events-none select-none',
        )}
        aria-hidden={isPinned}
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {renderTitle(title)}
            </div>
            {description ? (
              <p className={cn(dashboardText.description, 'mt-1')}>
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        ) : null}
      </motion.div>
      <div
        ref={sentinelRef}
        className="pointer-events-none absolute bottom-0 left-0 h-px w-full"
        aria-hidden
      />
    </div>
  )
}
