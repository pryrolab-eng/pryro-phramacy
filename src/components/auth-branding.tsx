'use client'

import { useEffect, useState } from 'react'
import { useBranding } from '@/hooks/useBranding'
import { LogoIcon } from '@/components/logo'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const DEFAULT_NAME = 'Pryrox'

function DefaultLogoMark({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoIcon />
      <span className="font-bold text-foreground tracking-tight text-base">
        {DEFAULT_NAME}
      </span>
    </span>
  )
}

/** Logo on auth pages — custom image URL if set, else gradient mark + name */
export function AuthBrandingLogo({
  className,
  prominent = false,
}: {
  className?: string
  /** Larger mark for mobile auth header */
  prominent?: boolean
}) {
  const { platformName, platformLogoUrl } = useBranding()

  if (platformLogoUrl) {
    return (
      <Image
        src={platformLogoUrl}
        alt={platformName}
        width={120}
        height={32}
        className={cn(
          prominent ? 'h-10 w-auto object-contain' : 'h-8 w-auto object-contain',
          className,
        )}
      />
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoIcon className={prominent ? 'size-9' : 'size-6'} />
      <span
        className={cn(
          'font-bold tracking-tight text-foreground',
          prominent ? 'text-lg' : 'text-base',
        )}
      >
        {platformName}
      </span>
    </span>
  )
}

/** Inline platform name — reads from admin settings */
export function AuthBrandingName({ className }: { className?: string }) {
  const { platformName } = useBranding()
  return <span className={className}>{platformName}</span>
}

/** Footer on the black right panel of auth pages */
export function AuthBrandingFooter({ className }: { className?: string }) {
  const { platformName, platformLogoUrl } = useBranding()

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1',
        className ?? 'absolute bottom-6 left-0 right-0',
      )}
    >
      {platformLogoUrl ? (
        <Image
          src={platformLogoUrl}
          alt={platformName}
          width={80}
          height={20}
          className="h-4 w-auto object-contain opacity-60 brightness-0 invert"
        />
      ) : (
        <span className="inline-flex items-center gap-1.5 opacity-60">
          <LogoIcon className="size-3.5 invert" uniColor />
          <span className="text-xs font-bold text-white">{platformName}</span>
        </span>
      )}
      <p className="text-xs text-gray-500" suppressHydrationWarning>
        © {new Date().getFullYear()} {platformName}. All rights reserved.
      </p>
    </div>
  )
}

/** Dynamic logo for use anywhere in the app (header, sidebar, etc.) */
export function DynamicLogo({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false)
  const { platformName, platformLogoUrl } = useBranding()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <DefaultLogoMark className={className} />
  }

  if (platformLogoUrl) {
    return (
      <Image
        src={platformLogoUrl}
        alt={platformName}
        width={120}
        height={32}
        className={className ?? 'h-7 w-auto object-contain'}
      />
    )
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoIcon />
      <span className="font-bold text-foreground tracking-tight text-base">{platformName}</span>
    </span>
  )
}
