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
    <div className="relative hidden min-h-0 w-1/2 flex-1 flex-col overflow-hidden bg-primary lg:flex">
      {showLogo ? (
        <div className="absolute left-6 top-6 z-20 sm:left-8 sm:top-8 [&_span]:text-white">
          <Link href="/">
            <AuthBrandingLogo />
          </Link>
        </div>
      ) : null}

      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20" />
      <div className="pointer-events-none absolute -left-16 bottom-10 h-40 w-40 rounded-full bg-white/15" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 px-8 py-10 xl:px-10">
        <div className="max-w-md text-center">
          <h2 className="text-balance text-2xl font-bold leading-snug text-white">
            Pharmacy Management Made Simple
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Pryrox helps pharmacies manage inventory, sales, prescriptions, and
            staff — all in one place.
          </p>
        </div>

        <div className="flex max-w-md flex-wrap justify-center gap-2">
          {FEATURES.map((f) => (
            <span
              key={f}
              className="rounded-[10px] border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white"
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 shrink-0 pb-8">
        <AuthBrandingFooter className="relative px-6" />
      </div>
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
    <div className="box-border flex min-h-[100dvh] w-full flex-col items-center justify-center bg-gray-50 px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:h-[100dvh] lg:max-h-[100dvh] lg:overflow-hidden lg:py-6">
      <div
        className={cn(
          'relative flex w-full min-w-0 flex-col rounded-2xl bg-white shadow-2xl sm:rounded-3xl',
          'max-w-[min(100%,24rem)] sm:max-w-md',
          'max-lg:min-h-[calc(100dvh-2rem)] max-lg:flex-1',
          'lg:max-h-[calc(100dvh-3rem)] lg:max-w-5xl lg:flex-row lg:overflow-hidden lg:flex-none',
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

        <div className="relative flex shrink-0 items-center justify-center border-b border-gray-100 px-5 py-4 lg:hidden">
          <Link href="/" className="inline-flex">
            <AuthBrandingLogo prominent />
          </Link>
          <Link
            href="/"
            className="absolute right-5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50"
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

        <div className="relative flex min-h-0 w-full flex-1 flex-col lg:min-h-0 lg:w-1/2 lg:shrink-0 lg:overflow-y-auto">
          <div className="flex min-h-0 flex-1 flex-col justify-center px-5 py-6 sm:px-8 sm:py-8 lg:flex-none lg:px-9 lg:pb-8 lg:pt-14 xl:px-10 xl:pt-16">
            <div className="mx-auto w-full min-w-0 max-w-md">
              <Link
                href="/"
                className="mb-5 hidden h-9 w-9 items-center justify-center rounded-[10px] border border-gray-200 text-gray-500 hover:bg-gray-50 lg:inline-flex"
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

          <p className="shrink-0 px-5 pb-6 text-center text-xs leading-relaxed text-gray-400 sm:px-8 lg:hidden">
            POS, inventory, prescriptions, insurance &amp; reports — built for
            pharmacies.
          </p>
        </div>

        {!panelFirst ? <MarketingPanel showLogo={false} /> : null}
      </div>
    </div>
  )
}

