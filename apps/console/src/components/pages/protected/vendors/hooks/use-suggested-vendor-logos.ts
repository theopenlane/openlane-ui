import { useMemo } from 'react'
import { useGetSubprocessors } from '@/lib/graphql-hooks/subprocessor'
import { toBase64DataUri } from '@/lib/image-utils'

export interface SuggestedLogo {
  id: string
  name: string
  logoUrl: string
}

const FAVICON_SIZE = 128
const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/

export const buildVendorLogoProxyUrl = (host: string): string => `/api/vendor-logo?domain=${encodeURIComponent(host)}&sz=${FAVICON_SIZE}`

const toHost = (domain: string): string | null => {
  const trimmed = domain.trim().toLowerCase()
  if (!trimmed) return null
  try {
    const { hostname } = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    return DOMAIN_REGEX.test(hostname) ? hostname : null
  } catch {
    return null
  }
}

interface UseSuggestedVendorLogosArgs {
  vendorName: string
  vendorDisplayName?: string | null
  domains?: string[] | null
  enabled?: boolean
}

export const useSuggestedVendorLogos = ({ vendorName, vendorDisplayName, domains, enabled = true }: UseSuggestedVendorLogosArgs): SuggestedLogo[] => {
  const searchTerms = useMemo(() => {
    const terms = [vendorName]
    if (vendorDisplayName && vendorDisplayName.toLowerCase() !== vendorName.toLowerCase()) {
      terms.push(vendorDisplayName)
    }
    return terms
  }, [vendorName, vendorDisplayName])

  const { subprocessors: nameResults } = useGetSubprocessors({
    where: { nameContainsFold: searchTerms[0] },
    enabled: enabled && !!searchTerms[0],
  })

  const { subprocessors: displayNameResults } = useGetSubprocessors({
    where: searchTerms[1] ? { nameContainsFold: searchTerms[1] } : undefined,
    enabled: enabled && !!searchTerms[1],
  })

  return useMemo(() => {
    const seen = new Set<string>()
    const results: SuggestedLogo[] = []

    for (const domain of domains ?? []) {
      const host = toHost(domain)
      if (!host || seen.has(host)) continue
      seen.add(host)
      results.push({ id: `favicon:${host}`, name: host, logoUrl: buildVendorLogoProxyUrl(host) })
    }

    for (const sp of [...(nameResults ?? []), ...(displayNameResults ?? [])]) {
      if (!sp || seen.has(sp.id)) continue
      const logoUrl = (sp.logoFile?.base64 ? toBase64DataUri(sp.logoFile.base64) : null) || sp.logoRemoteURL
      if (!logoUrl) continue
      seen.add(sp.id)
      results.push({ id: sp.id, name: sp.name, logoUrl })
    }

    return results
  }, [domains, nameResults, displayNameResults])
}
