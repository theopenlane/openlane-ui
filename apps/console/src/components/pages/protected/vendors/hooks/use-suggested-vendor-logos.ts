import { useMemo } from 'react'
import { useGetSubprocessors } from '@/lib/graphql-hooks/subprocessor'
import { toBase64DataUri } from '@/lib/image-utils'
import { buildVendorLogoProxyUrl, toVendorLogoHost } from '@/lib/vendor-logo'

export type SuggestedLogoSource = 'subprocessor' | 'favicon'

export interface SuggestedLogo {
  id: string
  name: string
  logoUrl: string
  source: SuggestedLogoSource
}

export const deriveVendorNameFromDomain = (domain: string): string | null => {
  const host = toVendorLogoHost(domain)
  if (!host) return null
  const label = host.replace(/^www\./, '').split('.')[0]
  if (!label) return null
  return label.charAt(0).toUpperCase() + label.slice(1)
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

    for (const sp of [...(nameResults ?? []), ...(displayNameResults ?? [])]) {
      if (!sp || seen.has(sp.id)) continue
      const logoUrl = (sp.logoFile?.base64 ? toBase64DataUri(sp.logoFile.base64) : null) || sp.logoRemoteURL
      if (!logoUrl) continue
      seen.add(sp.id)
      results.push({ id: sp.id, name: sp.name, logoUrl, source: 'subprocessor' })
    }

    for (const domain of domains ?? []) {
      const host = toVendorLogoHost(domain)
      if (!host || seen.has(host)) continue
      seen.add(host)
      results.push({ id: `favicon:${host}`, name: host, logoUrl: buildVendorLogoProxyUrl(host), source: 'favicon' })
    }

    return results
  }, [domains, nameResults, displayNameResults])
}
