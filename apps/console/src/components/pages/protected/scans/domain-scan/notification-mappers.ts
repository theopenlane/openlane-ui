import { logoUrlFromDomain } from '@/lib/image-utils'
import {
  DomainScanFindingCategory,
  type DomainItem,
  type DomainScanDomains,
  type DomainScanNotificationData,
  type Finding,
  type OverrideMap,
  type PlatformCandidate,
  type SystemCandidate,
  type Vendor,
} from './types'

export const UNKNOWN_DOMAIN = 'Unknown domain'

export type RefKind = 'vendor' | 'asset' | 'platform' | 'system' | 'finding'

const REF_SEPARATOR = ':'

export const makeRef = (kind: RefKind, value: string) => `${kind}${REF_SEPARATOR}${value}`

export const refValue = (ref: string) => ref.slice(ref.indexOf(REF_SEPARATOR) + 1)

export const canonicalizeEntityName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const canonicalizeLookupValue = (value?: string | null) => value?.trim().toLowerCase() || ''

export const sanitizeEntityName = (value: string) => value.replace(/[^a-zA-Z0-9\s-]/g, '').trim() || canonicalizeEntityName(value)

export const extractHostFromURL = (value?: string) => {
  if (!value) {
    return UNKNOWN_DOMAIN
  }

  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return UNKNOWN_DOMAIN
  }
}

export const resolveVendorLogoUrl = (domain?: string) => (domain === UNKNOWN_DOMAIN ? undefined : logoUrlFromDomain(domain))

export const guessDomainFromName = (name: string) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '')
  return slug ? `${slug}.com` : undefined
}

export const isPlaceholderValue = (value?: string) => !value || value.trim().toLowerCase() === 'unknown'

export const isDomainScanNotificationData = (value: unknown): value is DomainScanNotificationData => typeof value === 'object' && value !== null && 'scans' in value && Array.isArray(value.scans)

export const vendorsFromNotification = (data?: DomainScanNotificationData): Vendor[] => {
  const vendors = data?.vendors
  if (!vendors || vendors.length === 0) return []

  const mapByName = new Map<string, Vendor>()
  const unknownVendor = 'Unknown vendor'

  vendors.forEach((vendor) => {
    const name = vendor.name || unknownVendor
    const validUrl = isPlaceholderValue(vendor.url) ? undefined : vendor.url
    const detectedDomain = validUrl ? extractHostFromURL(validUrl) : undefined
    const domain = detectedDomain && detectedDomain !== UNKNOWN_DOMAIN ? detectedDomain : guessDomainFromName(name)

    const key = canonicalizeLookupValue(name) || canonicalizeLookupValue(sanitizeEntityName(name)) || canonicalizeLookupValue(validUrl) || 'vendor'

    const existingVendor = mapByName.get(key)

    if (!existingVendor) {
      mapByName.set(key, {
        id: makeRef('vendor', canonicalizeEntityName(name || validUrl || 'vendor')),
        name,
        legalName: vendor.legal_name?.trim() || undefined,
        providedServices: vendor.categories?.length ? vendor.categories : [],
        url: validUrl,
        domain,
        logoUrl: resolveVendorLogoUrl(domain),
      })
      return
    }

    existingVendor.providedServices = Array.from(new Set([...existingVendor.providedServices, ...(vendor.categories || [])]))
    existingVendor.legalName = existingVendor.legalName || vendor.legal_name?.trim() || undefined
    existingVendor.url = existingVendor.url || validUrl
    existingVendor.domain = existingVendor.domain || domain
    existingVendor.logoUrl = existingVendor.logoUrl || resolveVendorLogoUrl(domain)
  })

  return Array.from(mapByName.values())
}

export const ipAddressesFromNotification = (data?: DomainScanNotificationData): DomainItem[] => {
  const mapByAddress = new Map<string, DomainItem>()

  ;(data?.assets?.ip_addresses || []).forEach((record) => {
    const address = record.address?.trim()
    if (!address || mapByAddress.has(address)) return

    mapByAddress.set(address, { id: makeRef('asset', canonicalizeEntityName(address)), name: address, kind: 'ip', org: record.org })
  })

  return Array.from(mapByAddress.values())
}

export const technologiesFromNotification = (data?: DomainScanNotificationData): DomainItem[] => {
  const technologies = data?.technologies
  if (!technologies || technologies.length === 0) return []

  const mapByName = new Map<string, DomainItem>()

  technologies.forEach((technology) => {
    const name = technology.name?.trim()
    if (!name) return

    const key = canonicalizeLookupValue(name)
    const existingTechnology = mapByName.get(key)

    if (!existingTechnology) {
      mapByName.set(key, {
        id: makeRef('asset', canonicalizeEntityName(name)),
        name,
        kind: 'technology',
        categories: technology.categories?.length ? technology.categories : [],
      })
      return
    }

    existingTechnology.categories = Array.from(new Set([...(existingTechnology.categories || []), ...(technology.categories || [])]))
  })

  return Array.from(mapByName.values())
}

const scannedDomainsFromNotification = (data?: DomainScanNotificationData): string[] =>
  Array.from(new Set((data?.scans || []).map((scan) => scan.domain?.toLowerCase()).filter((domain): domain is string => Boolean(domain))))

const assetDomainItem = (domain: string, vendor?: string, primary?: boolean): DomainItem => ({
  id: makeRef('asset', canonicalizeEntityName(domain)),
  name: domain,
  primary,
  vendor,
})

export const domainsFromNotification = (data?: DomainScanNotificationData): DomainScanDomains => {
  const scannedDomains = scannedDomainsFromNotification(data)
  const hostname = scannedDomains[0] || UNKNOWN_DOMAIN
  const ip = ipAddressesFromNotification(data)
  const technologies = technologiesFromNotification(data)

  const vendorByDomain = new Map<string, string>()
  ;(data?.assets?.dns_records || []).forEach((record) => {
    const domain = record.domain?.toLowerCase()
    if (!domain || !record.vendor || isPlaceholderValue(record.vendor) || vendorByDomain.has(domain)) return
    vendorByDomain.set(domain, record.vendor)
  })

  const domains = Array.from(
    new Set(
      [...scannedDomains, ...(data?.assets?.dns_records || []).map((record) => record.domain?.toLowerCase()), ...(data?.assets?.internal_domains || []).map((domain) => domain?.toLowerCase())].filter(
        (domain): domain is string => Boolean(domain),
      ),
    ),
  )

  if (domains.length === 0) {
    return {
      owned: hostname === UNKNOWN_DOMAIN ? [] : [assetDomainItem(hostname, vendorByDomain.get(hostname), true)],
      external: [],
      ip,
      technologies,
      hostname,
    }
  }

  const ownedDomains: DomainItem[] = domains
    .filter((domain) => scannedDomains.includes(domain) || scannedDomains.some((scanned) => domain.endsWith(`.${scanned}`)))
    .map((domain) => assetDomainItem(domain, vendorByDomain.get(domain), scannedDomains.includes(domain)))
    .sort((a, b) => Number(b.primary) - Number(a.primary))

  const externalDomains: DomainItem[] = domains.filter((domain) => !ownedDomains.some((item) => item.name === domain)).map((domain) => assetDomainItem(domain, vendorByDomain.get(domain)))

  return {
    owned: ownedDomains.length > 0 ? ownedDomains : [assetDomainItem(hostname, undefined, true)],
    external: externalDomains,
    ip,
    technologies,
    hostname,
  }
}

const AGENT_READINESS_ITEM_REGEX = /<li>\s*<input[^>]*>\s*<strong>([\s\S]*?)<\/strong>:\s*([\s\S]*?)\s*<\/li>/gi

export const agentReadinessChecklistToMarkdown = (checklist?: string): string | undefined => {
  if (!checklist) return checklist

  const items: string[] = []
  const regex = new RegExp(AGENT_READINESS_ITEM_REGEX)
  let match: RegExpExecArray | null
  while ((match = regex.exec(checklist))) {
    const [, key, message] = match
    items.push(`- [ ] **${key.trim()}**: ${message.trim()}`)
  }

  return items.length > 0 ? items.join('\n') : checklist
}

export const findingsFromNotification = (data?: DomainScanNotificationData): Finding[] => {
  const riskItems = (data?.findings?.risks || []).map((finding) => ({ finding, category: DomainScanFindingCategory.RISK }))
  const securityViolationItems = (data?.findings?.security_violations || []).map((finding) => ({ finding, category: DomainScanFindingCategory.SECURITY_VIOLATION }))
  const items = [...riskItems, ...securityViolationItems]

  const genericFindings: Finding[] = items.map(({ finding, category }, index) => ({
    id: makeRef('finding', canonicalizeEntityName(finding.id || finding.title || finding.name || `finding-${index + 1}`)),
    title: finding.title || finding.name || `Finding ${index + 1}`,
    description: finding.description || finding.summary || finding.details,
    severity: finding.severity,
    category,
  }))

  const agentReadinessFindings: Finding[] = (data?.findings?.agent_readiness || [])
    .filter((entry) => entry.checklist || entry.level_name)
    .map((entry, index) => ({
      id: makeRef('finding', canonicalizeEntityName(entry.domain ? `agent-readiness-${entry.domain}` : `agent-readiness-${index + 1}`)),
      title: entry.level_name ? `AI agent readiness: ${entry.level_name}${entry.domain ? ` (${entry.domain})` : ''}` : 'AI agent readiness',
      description: agentReadinessChecklistToMarkdown(entry.checklist),
      category: DomainScanFindingCategory.AGENT_READINESS,
    }))

  return [...genericFindings, ...agentReadinessFindings]
}

export const resolveScanIds = (data?: DomainScanNotificationData): string[] => (data?.scans || []).map((scan) => scan.internal_scan_id).filter((id): id is string => Boolean(id))

export const SINGLE_PLATFORM_REF = makeRef('platform', 'primary')

export const platformCandidateFromNotification = (data?: DomainScanNotificationData, hostname?: string): PlatformCandidate => ({
  id: SINGLE_PLATFORM_REF,
  name: data?.platform?.name || hostname || 'Discovered platform',
  description: data?.platform?.description,
})

export const systemCandidatesFromNotification = (data?: DomainScanNotificationData): SystemCandidate[] => {
  const systems = data?.systems
  if (!systems || systems.length === 0) return []

  const mapByName = new Map<string, SystemCandidate>()

  systems.forEach((system) => {
    const name = system.system_name?.trim()
    if (!name) return

    const key = canonicalizeLookupValue(name)
    if (mapByName.has(key)) return

    mapByName.set(key, { id: makeRef('system', canonicalizeEntityName(name)), name, description: system.description })
  })

  return Array.from(mapByName.values())
}

export const platformCandidatesFromSystems = (systems: SystemCandidate[]): PlatformCandidate[] =>
  systems.map((system) => ({ id: makeRef('platform', refValue(system.id)), name: system.name, description: system.description }))

export const withOverride = <T extends { id: string; name: string; description?: string; domain?: string }>(item: T, overrides: OverrideMap): T => {
  const override = overrides[item.id]
  if (!override) return item

  return {
    ...item,
    name: override.name ?? item.name,
    description: override.description !== undefined ? override.description : item.description,
    domain: override.domain !== undefined ? override.domain : item.domain,
  }
}
