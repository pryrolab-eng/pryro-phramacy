'use client'

import { useBranding } from '@/hooks/useBranding'
import { LogoIcon } from '@/components/logo'
import Image from 'next/image'

/** Top-left logo on auth pages — uses custom logo URL if set, else icon + name */
export function AuthBrandingLogo({ className }: { className?: string }) {
  const { platformName, platformLogoUrl } = useBranding()

  if (platformLogoUrl) {
    return (
      <Image
        src={platformLogoUrl}
        alt={platformName}
        width={120}
        height={32}
        className={className ?? 'h-8 w-auto object-contain'}
      />
    )
  }

  return (
    <span className="inline-flex items-center gap-2">
      <LogoIcon />
      <span className="font-bold text-foreground tracking-tight text-base">{platformName}</span>
    </span>
  )
}

/** Inline platform name — reads from admin settings */
export function AuthBrandingName({ className }: { className?: string }) {
  const { platformName } = useBranding()
  return <span className={className}>{platformName}</span>
}

/** Footer on the black right panel of auth pages */
export function AuthBrandingFooter() {
  const { platformName, platformLogoUrl } = useBranding()

  return (
    <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1">
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
      <p className="text-xs text-gray-500">
        © {new Date().getFullYear()} {platformName}. All rights reserved.
      </p>
    </div>
  )
}

/** Dynamic logo for use anywhere in the app (header, sidebar, etc.) */
export function DynamicLogo({ className }: { className?: string }) {
  const { platformName, platformLogoUrl } = useBranding()

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
