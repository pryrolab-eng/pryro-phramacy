import type { ReactNode } from 'react'
import Link from 'next/link'
import { AuthBrandingFooter, AuthBrandingLogo } from '@/components/auth-branding'
import { cn } from '@/lib/utils'

const FEATURES = [
  'POS & Sales',
  'Inventory',
  'Prescriptions',
  'Insurance',
  'Reports',
  'Multi-Branch',
] as const

type AuthPageShellProps = {
  title: string
  description: string
  children: ReactNode
  panelPosition?: 'left' | 'right'
  logoOnDarkPanel?: boolean
}

function MarketingPanel({ showLogo = false }: { showLogo?: boolean }) {
  return (
    <div className="relative flex shrink-0 flex-col overflow-hidden bg-gray-950 max-lg:min-h-[180px] lg:min-h-0 lg:w-1/2 lg:flex-1">
      {showLogo ? (
        <div className="absolute left-6 top-6 z-20 sm:left-8 sm:top-8 [&_span]:text-white">
          <Link href="/">
            <AuthBrandingLogo />
          </Link>
        </div>
      ) : null}

      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/5 lg:h-64 lg:w-64" />
      <div className="pointer-events-none absolute -left-16 bottom-10 h-40 w-40 rounded-full bg-white/5" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-6 py-8 lg:gap-5 lg:px-8 lg:py-6 xl:px-10">
        <div className="max-w-sm text-center lg:max-w-md">
          <h2 className="text-balance text-xl font-bold leading-snug text-white lg:text-2xl">
            Pharmacy Management Made Simple
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Pryrox helps pharmacies manage inventory, sales, prescriptions, and
            staff — all in one place.
          </p>
        </div>

        <div className="flex max-w-sm flex-wrap justify-center gap-1.5 lg:max-w-md lg:gap-2">
          {FEATURES.map((f) => (
            <span
              key={f}
              className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-medium text-white lg:px-3 lg:py-1 lg:text-xs"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <AuthBrandingFooter />
    </div>
  )
}

/**
 * Auth card fits within the viewport (no page scroll at 100% zoom on desktop).
 * Height uses max-h + dvh; width reflows by breakpoint.
 */
export function AuthPageShell({
  title,
  description,
  children,
  panelPosition = 'right',
  logoOnDarkPanel = false,
}: AuthPageShellProps) {
  const panelFirst = panelPosition === 'left'

  return (
    <div className="box-border flex h-[100dvh] max-h-[100dvh] w-full items-center justify-center overflow-hidden bg-gray-50 p-3 sm:p-4 md:p-6">
      <div
        className={cn(
          'relative flex h-auto w-full min-h-0 max-h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl',
          'max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] md:max-h-[calc(100dvh-3rem)]',
          'sm:rounded-3xl',
          'max-w-[min(100%,28rem)] sm:max-w-xl md:max-w-3xl',
          'lg:max-h-[calc(100dvh-3rem)] lg:max-w-5xl lg:flex-row',
          'xl:max-w-6xl',
          '2xl:max-w-7xl',
        )}
      >
        {!logoOnDarkPanel ? (
          <div className="absolute left-5 top-5 z-30 hidden lg:block xl:left-6 xl:top-6">
            <Link href="/">
              <AuthBrandingLogo />
            </Link>
          </div>
        ) : null}

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-5 py-3.5 lg:hidden">
          <Link href="/" className="shrink-0">
            <AuthBrandingLogo />
          </Link>
          <Link
            href="/"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
            aria-label="Back to home"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
        </div>

        {panelFirst ? <MarketingPanel showLogo={logoOnDarkPanel} /> : null}

        <div className="relative flex min-h-0 w-full flex-col justify-center overflow-y-auto lg:w-1/2 lg:shrink-0">
          <div className="px-6 py-6 sm:px-8 sm:py-8 lg:px-9 lg:pb-8 lg:pt-14 xl:px-10 xl:pt-16">
            <div className="mx-auto w-full min-w-0 max-w-md">
              <Link
                href="/"
                className="mb-5 hidden h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 lg:inline-flex"
                aria-label="Back to home"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
              </Link>

              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                {title}
              </h1>
              <p className="mt-1.5 text-sm text-gray-500 sm:text-base">{description}</p>

              {children}
            </div>
          </div>
        </div>

        {!panelFirst ? <MarketingPanel showLogo={false} /> : null}
      </div>
    </div>
  )
}
