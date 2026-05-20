import { useEffect, useState } from 'react'

interface Branding {
  platformName: string
  platformLogoUrl: string | null
}

export function useBranding(): Branding {
  const [branding, setBranding] = useState<Branding>({
    platformName: 'Pryrox',
    platformLogoUrl: null,
  })

  useEffect(() => {
    fetch('/api/branding')
      .then((r) => r.json())
      .then((data) => setBranding(data))
      .catch(() => {})
  }, [])

  return branding
}
