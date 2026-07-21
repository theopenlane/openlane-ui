'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { defineStepper } from '@stepperize/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Building2, ChevronDown, Server, Box, Users, ShieldAlert } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Checkbox } from '@repo/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardTitle } from '@repo/ui/cardpanel'
import { PageHeading } from '@repo/ui/page-heading'
import { Separator } from '@repo/ui/separator'
import { Input } from '@repo/ui/input'
import { Textarea, EditableTextarea } from '@repo/ui/textarea'
import { EditableName } from './editable-name'
import PlateEditor from '@/components/shared/plate/plate-editor'
import { useNotificationsContext } from '@/providers/notifications-provider'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useVendorsWithFilter } from '@/lib/graphql-hooks/entity'
import { useAssetsWithFilter } from '@/lib/graphql-hooks/asset'
import { usePlatformsWithFilter } from '@/lib/graphql-hooks/platform'
import { useSystemDetailsWithFilter } from '@/lib/graphql-hooks/system-detail'
import { useScan, useUpdateScan, useImportDomainScanReview } from '@/lib/graphql-hooks/scan'
import { logoUrlFromDomain as sharedLogoUrlFromDomain } from '@/lib/image-utils'
import type {
  ImportDomainScanReviewVendorInput,
  ImportDomainScanReviewAssetInput,
  ImportDomainScanReviewPlatformInput,
  ImportDomainScanReviewSystemInput,
  ImportDomainScanReviewFindingInput,
} from '@repo/codegen/src/schema'

type Vendor = {
  id: string
  name: string
  providedServices: string[]
  url?: string
  domain?: string
  confidence?: string
  logoUrl?: string
}

type DomainItem = {
  id: string
  name: string
  primary?: boolean
  kind?: 'ip' | 'technology'
  org?: string
  categories?: string[]
  vendor?: string
}

type Finding = {
  id: string
  title: string
  description?: string
  severity?: string
  category?: string
  domain?: string
  rawPayload?: DomainScanFindingPayload | DomainScanAgentReadinessPayload
}

type PlatformMode = 'single' | 'per-system'

type PlatformCandidate = {
  id: string
  name: string
  description?: string
}

type SystemCandidate = {
  id: string
  name: string
  description?: string
}

type TextOverride = { name?: string; description?: string; domain?: string }
type OverrideMap = Record<string, TextOverride>

type DomainScanVendorPayload = {
  name?: string
  url?: string
  categories?: string[]
}

type DomainScanDnsRecordPayload = {
  domain?: string
  vendor?: string
}

type DomainScanIpAddressPayload = {
  address?: string
  org?: string
  asn?: string
}

type DomainScanFindingPayload = {
  id?: string
  title?: string
  description?: string
  severity?: string
  name?: string
  summary?: string
  details?: string
  reference?: string
}

type DomainScanAgentReadinessPayload = {
  level?: number
  level_name?: string
  checklist?: string
  reference?: string
  domain?: string
}

type DomainScanPlatformPayload = {
  name?: string
  description?: string
}

type DomainScanSystemPayload = {
  system_name?: string
  description?: string
}

type DomainScanResult = {
  domain: string
  internal_scan_id: string
  external_scan_id?: string
  url?: string
  status: string
}

type DomainScanNotificationData = {
  scans?: DomainScanResult[]
  vendors?: DomainScanVendorPayload[]
  technologies?: DomainScanVendorPayload[]
  platform?: DomainScanPlatformPayload
  systems?: DomainScanSystemPayload[]
  assets?: {
    dns_records?: DomainScanDnsRecordPayload[]
    internal_domains?: string[]
    ip_addresses?: DomainScanIpAddressPayload[]
  }
  findings?: {
    risks?: DomainScanFindingPayload[]
    security_violations?: DomainScanFindingPayload[]
    agent_readiness?: DomainScanAgentReadinessPayload[]
  }
}

const { useStepper } = defineStepper(
  { id: 'platform', label: 'Platform' },
  { id: 'systems', label: 'System Details' },
  { id: 'assets', label: 'Assets' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'link', label: 'Link' },
  { id: 'findings', label: 'Findings' },
  { id: 'confirm', label: 'Confirm' },
)

const unknownDomain = 'Unknown domain'

// this converts the entity name to normalized values like what the backend stores.
// we need this to prevent a user from adding the same entity twice as that would fail
//
//  Google Tag Manager -> google-tag-manager
//  Node.js -> node-js
const canocalizeEntityName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const canocalizeLookupValue = (value?: string | null) => value?.trim().toLowerCase() || ''

const sanitizeEntityName = (value: string) => {
  return value.replace(/[^a-zA-Z0-9\s-]/g, '').trim() || canocalizeEntityName(value)
}

const extractHostFromURL = (value?: string) => {
  if (!value) {
    return unknownDomain
  }

  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return unknownDomain
  }
}

const logoUrlFromDomain = (domain?: string) => {
  if (domain === unknownDomain) return undefined
  return sharedLogoUrlFromDomain(domain)
}

// best-effort default when the scan didn't detect a URL for a vendor, e.g. "Shopify" -> "shopify.com"
const guessDomainFromName = (name: string) => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '')
  return slug ? `${slug}.com` : undefined
}

// the scan payload uses the literal string "Unknown" as a placeholder for missing fields --
// that's truthy in JS, so it has to be filtered out explicitly wherever url/domain confidence matters
const isPlaceholderValue = (value?: string) => !value || value.trim().toLowerCase() === 'unknown'

const vendorsFromNotification = (data?: DomainScanNotificationData): Vendor[] => {
  const vendors = data?.vendors
  if (!vendors || vendors.length === 0) return []

  const mapByName = new Map<string, Vendor>()

  const unknownVendor = 'Unknown vendor'

  vendors.forEach((vendor) => {
    const name = vendor.name || unknownVendor
    const validUrl = isPlaceholderValue(vendor.url) ? undefined : vendor.url
    const detectedDomain = validUrl ? extractHostFromURL(validUrl) : undefined
    const domain = detectedDomain && detectedDomain !== unknownDomain ? detectedDomain : guessDomainFromName(name)

    const key = canocalizeLookupValue(name) || canocalizeLookupValue(sanitizeEntityName(name)) || canocalizeLookupValue(validUrl) || 'vendor'

    const existingVendor = mapByName.get(key)

    if (!existingVendor) {
      mapByName.set(key, {
        id: canocalizeEntityName(name || validUrl || 'vendor'),
        name,
        providedServices: vendor.categories?.length ? vendor.categories : [],
        url: validUrl,
        domain,
        logoUrl: logoUrlFromDomain(domain),
      })
      return
    }

    existingVendor.providedServices = Array.from(new Set([...existingVendor.providedServices, ...(vendor.categories || [])]))
    existingVendor.url = existingVendor.url || validUrl
    existingVendor.domain = existingVendor.domain || domain
    existingVendor.logoUrl = existingVendor.logoUrl || logoUrlFromDomain(domain)
  })

  return Array.from(mapByName.values())
}

const ipAddressesFromNotification = (data?: DomainScanNotificationData): DomainItem[] => {
  const mapByAddress = new Map<string, DomainItem>()

  ;(data?.assets?.ip_addresses || []).forEach((record) => {
    const address = record.address?.trim()
    if (!address || mapByAddress.has(address)) return

    mapByAddress.set(address, { id: canocalizeEntityName(address), name: address, kind: 'ip', org: record.org })
  })

  return Array.from(mapByAddress.values())
}

const technologiesFromNotification = (data?: DomainScanNotificationData): DomainItem[] => {
  const technologies = data?.technologies
  if (!technologies || technologies.length === 0) return []

  const mapByName = new Map<string, DomainItem>()

  technologies.forEach((technology) => {
    const name = technology.name?.trim()
    if (!name) return

    const key = canocalizeLookupValue(name)
    const existingTechnology = mapByName.get(key)

    if (!existingTechnology) {
      mapByName.set(key, { id: canocalizeEntityName(name), name, kind: 'technology', categories: technology.categories?.length ? technology.categories : [] })
      return
    }

    existingTechnology.categories = Array.from(new Set([...(existingTechnology.categories || []), ...(technology.categories || [])]))
  })

  return Array.from(mapByName.values())
}

const scannedDomainsFromNotification = (data?: DomainScanNotificationData): string[] =>
  Array.from(new Set((data?.scans || []).map((scan) => scan.domain?.toLowerCase()).filter(Boolean as unknown as (value: string | undefined) => value is string)))

const domainsFromNotification = (data?: DomainScanNotificationData): { owned: DomainItem[]; external: DomainItem[]; ip: DomainItem[]; technologies: DomainItem[]; hostname: string } => {
  const scannedDomains = scannedDomainsFromNotification(data)
  const hostname = scannedDomains[0] || unknownDomain
  const ip = ipAddressesFromNotification(data)
  const technologies = technologiesFromNotification(data)

  const vendorByDomain = new Map<string, string>()
  ;(data?.assets?.dns_records || []).forEach((record) => {
    const domain = record.domain?.toLowerCase()
    if (!domain || isPlaceholderValue(record.vendor) || vendorByDomain.has(domain)) return
    vendorByDomain.set(domain, record.vendor as string)
  })

  const domains = Array.from(
    new Set(
      [...scannedDomains, ...(data?.assets?.dns_records || []).map((record) => record.domain?.toLowerCase()), ...(data?.assets?.internal_domains || []).map((domain) => domain?.toLowerCase())].filter(
        Boolean as unknown as (value: string | undefined) => value is string,
      ),
    ),
  )

  if (domains.length === 0) {
    return {
      owned: hostname === unknownDomain ? [] : [{ id: canocalizeEntityName(hostname), name: hostname, primary: true, vendor: vendorByDomain.get(hostname) }],
      external: [],
      ip,
      technologies,
      hostname,
    }
  }

  // every domain the scan actually ran against is "owned" and primary, not just the first one --
  // subdomains discovered along the way (dns_records/internal_domains) are owned but not primary
  const ownedDomains: DomainItem[] = domains
    .filter((domain) => scannedDomains.includes(domain) || scannedDomains.some((scanned) => domain.endsWith(`.${scanned}`)))
    .map((domain) => ({ id: canocalizeEntityName(domain), name: domain, primary: scannedDomains.includes(domain), vendor: vendorByDomain.get(domain) }))
    .sort((a, b) => Number(b.primary) - Number(a.primary))

  const externalDomains: DomainItem[] = domains
    .filter((domain) => !ownedDomains.some((item) => item.name === domain))
    .map((domain) => ({ id: canocalizeEntityName(domain), name: domain, vendor: vendorByDomain.get(domain) }))

  return {
    owned: ownedDomains.length > 0 ? ownedDomains : [{ id: canocalizeEntityName(hostname), name: hostname, primary: true }],
    external: externalDomains,
    ip,
    technologies,
    hostname,
  }
}

const findingCategoryRisk = 'Risk'
const findingCategorySecurityViolation = 'Security violation'
const findingCategoryAgentReadiness = 'Agent readiness'

// the backend reports each failed check as `<li><input type="checkbox" disabled> <strong>key</strong>: message</li>` --
// Plate's HTML deserializer has no rule for a bare <input>, so it silently drops the checkbox and keeps only the text.
// GFM task list markdown (`- [ ] **key**: message`) is something Plate's markdown deserializer natively renders as a
// checked-list block, so the checklist is converted to that instead of being passed through as raw HTML.
const AGENT_READINESS_ITEM_REGEX = /<li>\s*<input[^>]*>\s*<strong>([\s\S]*?)<\/strong>:\s*([\s\S]*?)\s*<\/li>/gi

const agentReadinessChecklistToMarkdown = (checklist?: string): string | undefined => {
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

const findingsFromNotification = (data?: DomainScanNotificationData): Finding[] => {
  const riskItems = (data?.findings?.risks || []).map((finding) => ({ finding, category: findingCategoryRisk }))
  const securityViolationItems = (data?.findings?.security_violations || []).map((finding) => ({ finding, category: findingCategorySecurityViolation }))
  const items = [...riskItems, ...securityViolationItems]

  const genericFindings: Finding[] = items.map(({ finding, category }, index) => ({
    id: canocalizeEntityName(finding.id || finding.title || finding.name || `finding-${index + 1}`),
    title: finding.title || finding.name || `Finding ${index + 1}`,
    description: finding.description || finding.summary || finding.details,
    severity: finding.severity,
    category,
    rawPayload: finding,
  }))

  // agent readiness is reported as one scored entry per scanned domain, each with an internal
  // checklist
  const agentReadinessFindings: Finding[] = (data?.findings?.agent_readiness || [])
    .filter((entry) => entry.checklist || entry.level_name)
    .map((entry, index) => ({
      id: canocalizeEntityName(entry.domain ? `agent-readiness-${entry.domain}` : `agent-readiness-${index + 1}`),
      title: entry.level_name ? `AI agent readiness: ${entry.level_name}${entry.domain ? ` (${entry.domain})` : ''}` : 'AI agent readiness',
      description: agentReadinessChecklistToMarkdown(entry.checklist),
      category: findingCategoryAgentReadiness,
      rawPayload: entry,
    }))

  return [...genericFindings, ...agentReadinessFindings]
}

const resolveScanIds = (data?: DomainScanNotificationData): string[] => (data?.scans || []).map((scan) => scan.internal_scan_id).filter((id): id is string => Boolean(id))

const platformCandidateFromNotification = (data?: DomainScanNotificationData, hostname?: string): PlatformCandidate => ({
  id: 'platform',
  name: data?.platform?.name || hostname || 'Discovered platform',
  description: data?.platform?.description,
})

const systemCandidatesFromNotification = (data?: DomainScanNotificationData): SystemCandidate[] => {
  const systems = data?.systems
  if (!systems || systems.length === 0) return []

  const mapByName = new Map<string, SystemCandidate>()

  systems.forEach((system) => {
    const name = system.system_name?.trim()
    if (!name) return

    const key = canocalizeLookupValue(name)
    if (mapByName.has(key)) return

    mapByName.set(key, { id: canocalizeEntityName(name), name, description: system.description })
  })

  return Array.from(mapByName.values())
}

const platformCandidatesFromSystems = (systems: SystemCandidate[]): PlatformCandidate[] => systems.map((system) => ({ id: system.id, name: system.name, description: system.description }))

const withOverride = <T extends { id: string; name: string; description?: string; domain?: string }>(item: T, overrides: OverrideMap): T => {
  const override = overrides[item.id]
  if (!override) return item

  return {
    ...item,
    name: override.name ?? item.name,
    description: override.description !== undefined ? override.description : item.description,
    domain: override.domain !== undefined ? override.domain : item.domain,
  }
}

const SectionCard = ({
  title,
  count,
  description,
  children,
  footer,
  collapsible = false,
  defaultOpen = true,
  titleAction,
  className,
}: {
  title: React.ReactNode
  count?: number
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  titleAction?: React.ReactNode
  className?: string
}) => {
  const [open, setOpen] = useState(defaultOpen)
  const isOpen = collapsible ? open : true

  return (
    <Card className={className}>
      <CardTitle
        className={`flex items-center justify-between gap-2 text-xl py-3 ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={collapsible ? () => setOpen((value) => !value) : undefined}
      >
        <span className="flex items-center gap-2">
          {title}
          {count !== undefined ? <Badge variant="secondary">{count}</Badge> : null}
        </span>
        <span className="flex items-center gap-2 font-normal">
          {titleAction}
          {collapsible ? <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} /> : null}
        </span>
      </CardTitle>
      {description ? <CardDescription className="pb-3">{description}</CardDescription> : null}
      {isOpen ? (
        <>
          <Separator separatorClass="bg-border" />
          <CardContent className="p-0">{children}</CardContent>
        </>
      ) : null}
      {footer ? (
        <>
          <Separator separatorClass="bg-border" />
          <CardFooter className="py-3">{footer}</CardFooter>
        </>
      ) : null}
    </Card>
  )
}

const VendorLogo = ({ name, logoUrl }: { name: string; logoUrl?: string }) => (
  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
    {logoUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logoUrl} alt={`${name} logo`} className="h-full w-full object-contain p-1" onError={(event) => (event.currentTarget.style.display = 'none')} />
    ) : (
      <Building2 size={16} className="text-muted-foreground" />
    )}
  </div>
)

const SelectionRow = ({
  checked,
  onCheckedChange,
  disabled,
  title,
  description,
  meta,
  badges,
  trailing,
  leading,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  title: React.ReactNode
  description?: React.ReactNode
  meta?: string
  badges?: string[]
  trailing?: React.ReactNode
  leading?: React.ReactNode
}) => (
  <div className={`flex items-start gap-4 px-6 py-1 ${disabled ? 'opacity-60' : ''}`}>
    <div className="pt-0.5">
      <Checkbox checked={checked} disabled={disabled} onCheckedChange={(value) => onCheckedChange(value === true)} />
    </div>
    {leading ? <div className="pt-0.5">{leading}</div> : null}
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-base font-semibold">{title}</div>
        {badges?.map((badge) => (
          <Badge key={badge} variant="outline">
            {badge}
          </Badge>
        ))}
      </div>
      {description ? <div className="mt-0.5 text-sm text-muted-foreground">{description}</div> : null}
    </div>
    <div className="shrink-0 text-sm text-muted-foreground">{trailing ?? meta}</div>
  </div>
)

const EmptyState = ({ message }: { message: string }) => (
  <div className="px-6 py-5">
    <p className="text-sm text-muted-foreground">{message}</p>
  </div>
)

const toggleSetValue = (setState: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
  setState((prev) => {
    const next = new Set(prev)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    return next
  })
}

const setAllSelected = (setState: React.Dispatch<React.SetStateAction<Set<string>>>, ids: string[], selected: boolean) => {
  setState((prev) => {
    const next = new Set(prev)
    ids.forEach((id) => (selected ? next.add(id) : next.delete(id)))
    return next
  })
}

const SelectAllCheckbox = ({ ids, selected, setSelected }: { ids: string[]; selected: Set<string>; setSelected: React.Dispatch<React.SetStateAction<Set<string>>> }) => {
  if (ids.length === 0) return null

  const selectedCount = ids.filter((id) => selected.has(id)).length
  const allSelected = selectedCount === ids.length
  const checkedState: boolean | 'indeterminate' = allSelected ? true : selectedCount > 0 ? 'indeterminate' : false

  return (
    <label className="flex items-center gap-2 text-sm font-normal text-muted-foreground" onClick={(event) => event.stopPropagation()}>
      <Checkbox checked={checkedState} onCheckedChange={() => setAllSelected(setSelected, ids, !allSelected)} />
      {selectedCount} of {ids.length} selected
    </label>
  )
}

const checkSetsUnion = (left: Set<string>, right: Set<string>) => {
  if (left.size !== right.size) return false

  for (const value of left) {
    if (!right.has(value)) return false
  }

  return true
}

const toggleLinkValue = (setLinks: React.Dispatch<React.SetStateAction<Record<string, Set<string>>>>, targetId: string, itemId: string, defaultIds: string[] = []) => {
  setLinks((prev) => {
    const current = prev[targetId] ? new Set(prev[targetId]) : new Set(defaultIds)
    if (current.has(itemId)) {
      current.delete(itemId)
    } else {
      current.add(itemId)
    }
    return { ...prev, [targetId]: current }
  })
}

const getLinkedIds = (links: Record<string, Set<string>>, targetId: string, defaultIds: string[] = []) => links[targetId] ?? new Set(defaultIds)

const setAllLinked = (setLinks: React.Dispatch<React.SetStateAction<Record<string, Set<string>>>>, targetId: string, ids: string[], linked: boolean) => {
  setLinks((prev) => ({ ...prev, [targetId]: new Set(linked ? ids : []) }))
}

const LinkSelectAllToggle = ({
  targetId,
  ids,
  links,
  setLinks,
  defaultIds = [],
}: {
  targetId: string
  ids: string[]
  links: Record<string, Set<string>>
  setLinks: React.Dispatch<React.SetStateAction<Record<string, Set<string>>>>
  defaultIds?: string[]
}) => {
  if (ids.length === 0) return null

  const linkedIds = getLinkedIds(links, targetId, defaultIds)
  const allLinked = ids.every((id) => linkedIds.has(id))

  return (
    <Button variant="secondary" onClick={() => setAllLinked(setLinks, targetId, ids, !allLinked)}>
      {allLinked ? 'Deselect all' : 'Select all'}
    </Button>
  )
}

const LinkTargetCard = ({
  target,
  kind,
  vendors,
  assets,
  vendorLinks,
  setVendorLinks,
  assetLinks,
  setAssetLinks,
}: {
  target: { id: string; name: string }
  kind: 'platform' | 'system'
  vendors: { id: string; name: string; logoUrl?: string }[]
  assets: { id: string; name: string }[]
  vendorLinks: Record<string, Set<string>>
  setVendorLinks: React.Dispatch<React.SetStateAction<Record<string, Set<string>>>>
  assetLinks: Record<string, Set<string>>
  setAssetLinks: React.Dispatch<React.SetStateAction<Record<string, Set<string>>>>
}) => {
  const vendorIds = vendors.map((vendor) => vendor.id)
  const assetIds = assets.map((asset) => asset.id)
  // platforms start with everything linked; systems start with nothing linked
  const defaultVendorIds = kind === 'platform' ? vendorIds : []
  const defaultAssetIds = kind === 'platform' ? assetIds : []
  const linkedVendorIds = getLinkedIds(vendorLinks, target.id, defaultVendorIds)
  const linkedAssetIds = getLinkedIds(assetLinks, target.id, defaultAssetIds)

  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <Badge variant={kind === 'platform' ? 'primary' : 'outline'}>{kind === 'platform' ? 'Platform' : 'System'}</Badge>
          {target.name}
        </span>
      }
      description={
        kind === 'platform' ? 'Everything is linked by default,  uncheck anything that does not belong here' : 'Nothing is linked by default, check the vendors and assets that belong here.'
      }
      collapsible
      className={kind === 'platform' ? 'border-l-4 border-l-brand' : 'border-l-4 border-l-border'}
    >
      {vendors.length > 0 ? (
        <div className="px-6 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Vendors ({linkedVendorIds.size} of {vendors.length} linked)
            </p>
            <LinkSelectAllToggle targetId={target.id} ids={vendorIds} links={vendorLinks} setLinks={setVendorLinks} defaultIds={defaultVendorIds} />
          </div>
          <div className="flex flex-wrap gap-2">
            {vendors.map((vendor) => (
              <label key={vendor.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-sm">
                <Checkbox checked={linkedVendorIds.has(vendor.id)} onCheckedChange={() => toggleLinkValue(setVendorLinks, target.id, vendor.id, defaultVendorIds)} />
                <VendorLogo name={vendor.name} logoUrl={vendor.logoUrl} />
                {vendor.name}
              </label>
            ))}
          </div>
        </div>
      ) : null}
      {vendors.length > 0 && assets.length > 0 ? <Separator separatorClass="bg-border" /> : null}
      {assets.length > 0 ? (
        <div className="px-6 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Assets ({linkedAssetIds.size} of {assets.length} linked)
            </p>
            <LinkSelectAllToggle targetId={target.id} ids={assetIds} links={assetLinks} setLinks={setAssetLinks} defaultIds={defaultAssetIds} />
          </div>
          <div className="flex flex-wrap gap-2">
            {assets.map((asset) => (
              <label key={asset.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1 text-sm">
                <Checkbox checked={linkedAssetIds.has(asset.id)} onCheckedChange={() => toggleLinkValue(setAssetLinks, target.id, asset.id, defaultAssetIds)} />
                {asset.name}
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}

const LinkStep = ({
  platforms,
  systems,
  vendors,
  assets,
  vendorLinks,
  setVendorLinks,
  assetLinks,
  setAssetLinks,
  systemVendorLinks,
  setSystemVendorLinks,
  systemAssetLinks,
  setSystemAssetLinks,
}: {
  platforms: { id: string; name: string }[]
  systems: { id: string; name: string }[]
  vendors: { id: string; name: string; logoUrl?: string }[]
  assets: { id: string; name: string }[]
  vendorLinks: Record<string, Set<string>>
  setVendorLinks: React.Dispatch<React.SetStateAction<Record<string, Set<string>>>>
  assetLinks: Record<string, Set<string>>
  setAssetLinks: React.Dispatch<React.SetStateAction<Record<string, Set<string>>>>
  systemVendorLinks: Record<string, Set<string>>
  setSystemVendorLinks: React.Dispatch<React.SetStateAction<Record<string, Set<string>>>>
  systemAssetLinks: Record<string, Set<string>>
  setSystemAssetLinks: React.Dispatch<React.SetStateAction<Record<string, Set<string>>>>
}) => {
  if (platforms.length === 0) {
    return (
      <SectionCard title="Link vendors and assets" description="Select at least one platform to configure linking.">
        <EmptyState message="No platforms selected." />
      </SectionCard>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Platforms</p>
        {platforms.map((platform) => (
          <LinkTargetCard
            key={platform.id}
            target={platform}
            kind="platform"
            vendors={vendors}
            assets={assets}
            vendorLinks={vendorLinks}
            setVendorLinks={setVendorLinks}
            assetLinks={assetLinks}
            setAssetLinks={setAssetLinks}
          />
        ))}
      </div>

      {systems.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">System Details - optionally narrow down which vendors and assets belong to each system</p>
          {systems.map((system) => (
            <LinkTargetCard
              key={system.id}
              target={system}
              kind="system"
              vendors={vendors}
              assets={assets}
              vendorLinks={systemVendorLinks}
              setVendorLinks={setSystemVendorLinks}
              assetLinks={systemAssetLinks}
              setAssetLinks={setSystemAssetLinks}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

const VendorsStep = ({
  vendors,
  selected,
  setSelected,
  existingIds,
  overrides,
  setOverrides,
}: {
  vendors: Vendor[]
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
  existingIds: Set<string>
  overrides: OverrideMap
  setOverrides: React.Dispatch<React.SetStateAction<OverrideMap>>
}) => {
  const selectableIds = vendors.filter((vendor) => !existingIds.has(vendor.id)).map((vendor) => vendor.id)

  const sortedVendors = useMemo(
    () =>
      [...vendors].sort((a, b) => {
        const aPreSelected = existingIds.has(a.id) || Boolean(a.url)
        const bPreSelected = existingIds.has(b.id) || Boolean(b.url)
        return Number(bPreSelected) - Number(aPreSelected)
      }),
    [vendors, existingIds],
  )

  return (
    <SectionCard
      title="Review vendors"
      description="Grouped from detected technologies and ASNs. Names are editable, set a domain if one is missing to pull in its logo."
      titleAction={<SelectAllCheckbox ids={selectableIds} selected={selected} setSelected={setSelected} />}
    >
      {sortedVendors.length === 0 ? (
        <EmptyState message="No vendors were detected in this notification." />
      ) : (
        sortedVendors.map((vendor, index) => {
          const resolved = withOverride(vendor, overrides)
          const isExisting = existingIds.has(vendor.id)
          const liveLogoUrl = resolved.domain ? logoUrlFromDomain(resolved.domain) : vendor.logoUrl
          return (
            <React.Fragment key={vendor.id}>
              <SelectionRow
                checked={isExisting || selected.has(vendor.id)}
                onCheckedChange={() => toggleSetValue(setSelected, vendor.id)}
                disabled={isExisting}
                title={<EditableName value={resolved.name} onChange={(name) => setOverrides((prev) => ({ ...prev, [vendor.id]: { ...prev[vendor.id], name } }))} placeholder={vendor.name} />}
                leading={<VendorLogo name={resolved.name} logoUrl={liveLogoUrl} />}
                badges={vendor.providedServices}
                description={
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Domain:</span>
                    <Input
                      value={resolved.domain ?? ''}
                      onChange={(event) => setOverrides((prev) => ({ ...prev, [vendor.id]: { ...prev[vendor.id], domain: event.target.value } }))}
                      placeholder="example.com"
                      className="h-7 max-w-56 text-xs"
                    />
                  </div>
                }
                trailing={isExisting ? <Badge variant="secondary">Already added</Badge> : vendor.confidence}
              />
              {index < sortedVendors.length - 1 ? <Separator separatorClass="bg-border" /> : null}
            </React.Fragment>
          )
        })
      )}
    </SectionCard>
  )
}

const AssetsStep = ({
  owned,
  external,
  ip,
  technologies,
  selected,
  setSelected,
  existingIds,
  overrides,
  setOverrides,
}: {
  owned: DomainItem[]
  external: DomainItem[]
  ip: DomainItem[]
  technologies: DomainItem[]
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
  existingIds: Set<string>
  overrides: OverrideMap
  setOverrides: React.Dispatch<React.SetStateAction<OverrideMap>>
}) => {
  const selectableIds = (items: DomainItem[]) => items.filter((item) => !existingIds.has(item.id)).map((item) => item.id)
  const ownedSelectableIds = selectableIds(owned)
  const technologySelectableIds = selectableIds(technologies)
  const externalSelectableIds = selectableIds(external)
  const ipSelectableIds = selectableIds(ip)

  const editableTitle = (item: DomainItem) => (
    <EditableName value={overrides[item.id]?.name ?? item.name} onChange={(name) => setOverrides((prev) => ({ ...prev, [item.id]: { ...prev[item.id], name } }))} placeholder={item.name} />
  )

  return (
    <div className="space-y-4">
      <SectionCard
        title="Owned domains"
        count={owned.length}
        description="Names are editable"
        titleAction={<SelectAllCheckbox ids={ownedSelectableIds} selected={selected} setSelected={setSelected} />}
      >
        {owned.length === 0 ? (
          <EmptyState message="No owned domains were detected in this notification." />
        ) : (
          owned.map((domain, index) => (
            <React.Fragment key={domain.id}>
              <SelectionRow
                checked={existingIds.has(domain.id) || selected.has(domain.id)}
                onCheckedChange={() => toggleSetValue(setSelected, domain.id)}
                disabled={existingIds.has(domain.id)}
                title={editableTitle(domain)}
                leading={domain.vendor ? <VendorLogo name={domain.vendor} logoUrl={logoUrlFromDomain(guessDomainFromName(domain.vendor))} /> : undefined}
                badges={domain.vendor ? [domain.vendor] : undefined}
                trailing={existingIds.has(domain.id) ? <Badge variant="secondary">Already added</Badge> : domain.primary ? <Badge variant="secondary">Primary</Badge> : undefined}
              />
              {index < owned.length - 1 ? <Separator separatorClass="bg-border" /> : null}
            </React.Fragment>
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Technologies"
        count={technologies.length}
        description="Non-vendor technologies detected during the scan"
        titleAction={<SelectAllCheckbox ids={technologySelectableIds} selected={selected} setSelected={setSelected} />}
      >
        {technologies.length === 0 ? (
          <EmptyState message="No technologies were detected in this notification." />
        ) : (
          technologies.map((technology, index) => (
            <React.Fragment key={technology.id}>
              <SelectionRow
                checked={existingIds.has(technology.id) || selected.has(technology.id)}
                onCheckedChange={() => toggleSetValue(setSelected, technology.id)}
                disabled={existingIds.has(technology.id)}
                title={editableTitle(technology)}
                badges={technology.categories}
                trailing={existingIds.has(technology.id) ? <Badge variant="secondary">Already added</Badge> : <Badge variant="outline">Technology</Badge>}
              />
              {index < technologies.length - 1 ? <Separator separatorClass="bg-border" /> : null}
            </React.Fragment>
          ))
        )}
      </SectionCard>

      <SectionCard
        title="External domains"
        count={external.length}
        description="Optional related domains detected during the scan"
        titleAction={<SelectAllCheckbox ids={externalSelectableIds} selected={selected} setSelected={setSelected} />}
        collapsible
        defaultOpen={false}
      >
        {external.length === 0 ? (
          <EmptyState message="No external domains were detected in this notification." />
        ) : (
          external.map((domain, index) => (
            <React.Fragment key={domain.id}>
              <SelectionRow
                checked={existingIds.has(domain.id) || selected.has(domain.id)}
                onCheckedChange={() => toggleSetValue(setSelected, domain.id)}
                disabled={existingIds.has(domain.id)}
                title={editableTitle(domain)}
                leading={domain.vendor ? <VendorLogo name={domain.vendor} logoUrl={logoUrlFromDomain(guessDomainFromName(domain.vendor))} /> : undefined}
                badges={domain.vendor ? [domain.vendor] : undefined}
                trailing={existingIds.has(domain.id) ? <Badge variant="secondary">Already added</Badge> : undefined}
              />
              {index < external.length - 1 ? <Separator separatorClass="bg-border" /> : null}
            </React.Fragment>
          ))
        )}
      </SectionCard>

      <SectionCard
        title="IP addresses"
        count={ip.length}
        description="Resolved IP addresses detected during the scan"
        titleAction={<SelectAllCheckbox ids={ipSelectableIds} selected={selected} setSelected={setSelected} />}
        collapsible
        defaultOpen={false}
      >
        {ip.length === 0 ? (
          <EmptyState message="No IP addresses were detected in this notification." />
        ) : (
          ip.map((address, index) => (
            <React.Fragment key={address.id}>
              <SelectionRow
                checked={existingIds.has(address.id) || selected.has(address.id)}
                onCheckedChange={() => toggleSetValue(setSelected, address.id)}
                disabled={existingIds.has(address.id)}
                title={editableTitle(address)}
                badges={address.org ? [address.org] : undefined}
                trailing={existingIds.has(address.id) ? <Badge variant="secondary">Already added</Badge> : <Badge variant="outline">IP address</Badge>}
              />
              {index < ip.length - 1 ? <Separator separatorClass="bg-border" /> : null}
            </React.Fragment>
          ))
        )}
      </SectionCard>
    </div>
  )
}

const FindingsStep = ({
  findings,
  selected,
  setSelected,
  agentReadiness,
  overrides,
  setOverrides,
}: {
  findings: Finding[]
  selected: Set<string>
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>
  agentReadiness?: DomainScanAgentReadinessPayload[]
  overrides: OverrideMap
  setOverrides: React.Dispatch<React.SetStateAction<OverrideMap>>
}) => {
  if (findings.length === 0) {
    return (
      <SectionCard title="Review findings" description="Optional security observations detected">
        <EmptyState message="No findings were included in this scan" />
      </SectionCard>
    )
  }

  const groups: { category: string; description?: string; items: Finding[] }[] = [
    { category: findingCategoryRisk, items: findings.filter((finding) => finding.category === findingCategoryRisk) },
    { category: findingCategorySecurityViolation, items: findings.filter((finding) => finding.category === findingCategorySecurityViolation) },
    {
      category: findingCategoryAgentReadiness,
      description: (() => {
        const levels = (agentReadiness || [])
          .filter((entry) => entry.level_name)
          .map((entry) => `${entry.domain ? `${entry.domain}: ` : ''}${entry.level_name}${entry.level !== undefined ? ` (Level ${entry.level})` : ''}`)
        return levels.length > 0 ? `Checks that failed against AI agent readiness. Overall level: ${levels.join(', ')}.` : 'Checks that failed against AI agent readiness.'
      })(),
      items: findings.filter((finding) => finding.category === findingCategoryAgentReadiness),
    },
  ]

  return (
    <div className="space-y-4">
      {groups
        .filter((group) => group.items.length > 0)
        .map((group) => {
          const groupIds = group.items.map((finding) => finding.id)

          return (
            <SectionCard
              key={group.category}
              title={group.category}
              count={group.items.length}
              description={group.description}
              titleAction={<SelectAllCheckbox ids={groupIds} selected={selected} setSelected={setSelected} />}
              collapsible
            >
              {group.items.map((finding, index) => (
                <React.Fragment key={finding.id}>
                  <SelectionRow
                    checked={selected.has(finding.id)}
                    onCheckedChange={() => toggleSetValue(setSelected, finding.id)}
                    title={
                      <EditableName
                        value={overrides[finding.id]?.name ?? finding.title}
                        onChange={(name) => setOverrides((prev) => ({ ...prev, [finding.id]: { ...prev[finding.id], name } }))}
                        placeholder={finding.title}
                      />
                    }
                    description={
                      finding.category === findingCategoryAgentReadiness ? (
                        <PlateEditor key={finding.id} initialValue={finding.description ?? ''} readonly variant="readonly" toolbarClassName="hidden" />
                      ) : (
                        <EditableTextarea
                          value={(overrides[finding.id]?.description ?? finding.description) || ''}
                          onChange={(event) => setOverrides((prev) => ({ ...prev, [finding.id]: { ...prev[finding.id], description: event.target.value } }))}
                          placeholder="Add a description"
                          className="min-h-0 border-none bg-transparent p-0 text-sm text-muted-foreground"
                        />
                      )
                    }
                    meta={finding.severity}
                  />
                  {index < group.items.length - 1 ? <Separator separatorClass="bg-border" /> : null}
                </React.Fragment>
              ))}
            </SectionCard>
          )
        })}
    </div>
  )
}

const ConfirmGroup = ({
  title,
  items,
  vendors,
  vendorLinks,
  vendorLinksDefaultToAll,
  onEdit,
}: {
  title: string
  items: { id: string; name: string; description?: string; logoUrl?: string }[]
  vendors?: { id: string; name: string }[]
  vendorLinks?: Record<string, Set<string>>
  vendorLinksDefaultToAll?: boolean
  onEdit: () => void
}) => (
  <SectionCard
    title={title}
    count={items.length}
    collapsible
    defaultOpen={false}
    titleAction={
      <Button
        variant="secondary"
        onClick={(event) => {
          event.stopPropagation()
          onEdit()
        }}
      >
        Edit
      </Button>
    }
  >
    {items.length === 0 ? (
      <EmptyState message="None selected." />
    ) : (
      items.map((item, index) => {
        const linkedVendorNames = vendors
          ? Array.from(getLinkedIds(vendorLinks ?? {}, item.id, vendorLinksDefaultToAll ? vendors.map((vendor) => vendor.id) : []))
              .map((id) => vendors.find((vendor) => vendor.id === id)?.name)
              .filter((name): name is string => Boolean(name))
          : []

        return (
          <React.Fragment key={item.id}>
            <div className="flex items-start gap-3 px-6 py-3">
              {item.logoUrl !== undefined ? <VendorLogo name={item.name} logoUrl={item.logoUrl} /> : null}
              <div className="min-w-0">
                <p className="text-sm font-medium">{item.name}</p>
                {item.description ? <p className="mt-0.5 text-sm text-muted-foreground">{item.description}</p> : null}
                {linkedVendorNames.length > 0 ? <p className="mt-1 text-xs text-muted-foreground">Vendors: {linkedVendorNames.join(', ')}</p> : null}
              </div>
            </div>
            {index < items.length - 1 ? <Separator separatorClass="bg-border" /> : null}
          </React.Fragment>
        )
      })
    )}
  </SectionCard>
)

const ConfirmStep = ({
  platforms,
  systems,
  vendors,
  assets,
  findings,
  platformVendorLinks,
  systemVendorLinks,
  systemVendorLinksDefaultToAll,
  onEditStep,
}: {
  platforms: { id: string; name: string; description?: string }[]
  systems: { id: string; name: string; description?: string }[]
  vendors: { id: string; name: string; logoUrl?: string }[]
  assets: { id: string; name: string }[]
  findings: { id: string; name: string }[]
  platformVendorLinks: Record<string, Set<string>>
  systemVendorLinks: Record<string, Set<string>>
  systemVendorLinksDefaultToAll: boolean
  onEditStep: (stepId: 'platform' | 'systems' | 'vendors' | 'assets' | 'findings') => void
}) => (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">Review everything below before importing it into Openlane. Each section is collapsed by default, expand to see individual entries.</p>
    <ConfirmGroup title="Platforms" items={platforms} vendors={vendors} vendorLinks={platformVendorLinks} vendorLinksDefaultToAll onEdit={() => onEditStep('platform')} />
    <ConfirmGroup
      title="System Details"
      items={systems}
      vendors={vendors}
      vendorLinks={systemVendorLinks}
      vendorLinksDefaultToAll={systemVendorLinksDefaultToAll}
      onEdit={() => onEditStep('systems')}
    />
    <ConfirmGroup title="Vendors" items={vendors} onEdit={() => onEditStep('vendors')} />
    <ConfirmGroup title="Assets" items={assets} onEdit={() => onEditStep('assets')} />
    <ConfirmGroup title="Findings" items={findings} onEdit={() => onEditStep('findings')} />
  </div>
)

const SidebarGroupRow = ({ title, items, onEdit }: { title: string; items: { id: string; name: string; logoUrl?: string }[]; onEdit: () => void }) => {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <div className="flex cursor-pointer items-center justify-between px-4 py-3 select-none" onClick={() => setOpen((value) => !value)}>
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
          <Badge variant="secondary">{items.length}</Badge>
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={(event) => {
              event.stopPropagation()
              onEdit()
            }}
          >
            Edit
          </Button>
          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? '' : '-rotate-90'}`} />
        </div>
      </div>
      {open ? (
        <div className="space-y-3 px-4 pt-1 pb-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">None selected.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                {item.logoUrl !== undefined ? <VendorLogo name={item.name} logoUrl={item.logoUrl} /> : null}
                <span className="text-sm">{item.name}</span>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

const ScanFoundSummary = ({
  hostname,
  systemsCount,
  assetsCount,
  vendorsCount,
  findingsCount,
}: {
  hostname: string
  systemsCount: number
  assetsCount: number
  vendorsCount: number
  findingsCount: number
}) => {
  const rows: { icon: React.ReactNode; count: number; label: string }[] = [
    { icon: <Server size={16} />, count: systemsCount, label: 'systems' },
    { icon: <Box size={16} />, count: assetsCount, label: 'assets' },
    { icon: <Users size={16} />, count: vendorsCount, label: 'vendors' },
    { icon: <ShieldAlert size={16} />, count: findingsCount, label: 'findings' },
  ]

  return (
    <Card className="mb-6">
      <CardTitle className="text-xl py-3">Here's what we found</CardTitle>
      <CardDescription className="pb-3">We scanned {hostname} and found the following. Review and edit each section as you go.</CardDescription>
      <Separator separatorClass="bg-border" />
      <CardContent className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand/10 text-brand">{row.icon}</span>
            <span className="text-base font-semibold">{row.count}</span>
            <span className="text-sm text-muted-foreground">{row.label}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

const ScanSummarySidebar = ({
  platforms,
  systems,
  vendors,
  assets,
  findings,
  onEditStep,
}: {
  platforms: { id: string; name: string }[]
  systems: { id: string; name: string }[]
  vendors: { id: string; name: string; logoUrl?: string }[]
  assets: { id: string; name: string }[]
  findings: { id: string; name: string }[]
  onEditStep: (stepId: 'platform' | 'systems' | 'vendors' | 'assets' | 'findings') => void
}) => (
  <Card>
    <CardTitle className="text-xl py-3">What you're adding</CardTitle>
    <CardDescription className="pb-3">A live summary of what will be created. Expand a section to see the individual entries, or edit to jump back.</CardDescription>
    <Separator separatorClass="bg-border" />
    <SidebarGroupRow title="Platforms" items={platforms} onEdit={() => onEditStep('platform')} />
    <Separator separatorClass="bg-border" />
    <SidebarGroupRow title="System Details" items={systems} onEdit={() => onEditStep('systems')} />
    <Separator separatorClass="bg-border" />
    <SidebarGroupRow title="Vendors" items={vendors} onEdit={() => onEditStep('vendors')} />
    <Separator separatorClass="bg-border" />
    <SidebarGroupRow title="Assets" items={assets} onEdit={() => onEditStep('assets')} />
    <Separator separatorClass="bg-border" />
    <SidebarGroupRow title="Findings" items={findings} onEdit={() => onEditStep('findings')} />
  </Card>
)

const PlatformStep = ({
  mode,
  setMode,
  hostname,
  singleCandidate,
  singleOverride,
  setSingleOverride,
  perSystemCandidates,
  selectedPerSystemIds,
  setSelectedPerSystemIds,
  perSystemOverrides,
  setPerSystemOverrides,
  existingPlatformNames,
}: {
  mode: PlatformMode
  setMode: (mode: PlatformMode) => void
  hostname: string
  singleCandidate: PlatformCandidate
  singleOverride: TextOverride
  setSingleOverride: React.Dispatch<React.SetStateAction<TextOverride>>
  perSystemCandidates: PlatformCandidate[]
  selectedPerSystemIds: Set<string>
  setSelectedPerSystemIds: React.Dispatch<React.SetStateAction<Set<string>>>
  perSystemOverrides: OverrideMap
  setPerSystemOverrides: React.Dispatch<React.SetStateAction<OverrideMap>>
  existingPlatformNames: Set<string>
}) => {
  const singleAlreadyExists = existingPlatformNames.has(canocalizeLookupValue(singleCandidate.name))

  return (
    <div className="space-y-3">
      {mode === 'single' ? (
        <>
          <SectionCard
            title={
              <span className="flex items-center gap-2">
                Start with your platform
                {singleAlreadyExists ? <Badge variant="secondary">Already added</Badge> : null}
              </span>
            }
            description="A platform represents a your  top-level product or service offering. It defines what is being evaluated as part of a compliance program or audit.

Next, you'll break the platform down into the system details, assets, vendors, and other components that support it."
          >
            <div className="space-y-4 px-6 py-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Platform name</label>
                <Input
                  value={singleOverride.name ?? singleCandidate.name}
                  onChange={(event) => setSingleOverride((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder={singleCandidate.name}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Description <span className="font-normal text-muted-foreground">- Optional</span>
                </label>
                <Textarea
                  value={(singleOverride.description ?? singleCandidate.description) || ''}
                  onChange={(event) => setSingleOverride((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Add a short description of this platform"
                />
              </div>
            </div>
          </SectionCard>

          <button type="button" className="px-1 text-sm text-primary underline decoration-dotted" onClick={() => setMode('per-system')}>
            Split these results into multiple platforms
          </button>
        </>
      ) : (
        <>
          <p className="px-1 text-sm text-muted-foreground">
            Creating one platform per detected system.{' '}
            <button type="button" className="text-primary underline decoration-dotted" onClick={() => setMode('single')}>
              Switch back to a single platform for {hostname}
            </button>
            .
          </p>

          <SectionCard title="Platforms" count={perSystemCandidates.length} description="One platform will be created per selected system. Names and descriptions are editable.">
            {perSystemCandidates.length === 0 ? (
              <EmptyState message="No systems were detected in this notification." />
            ) : (
              perSystemCandidates.map((candidate, index) => {
                const alreadyExists = existingPlatformNames.has(canocalizeLookupValue(candidate.name))
                return (
                  <React.Fragment key={candidate.id}>
                    <SelectionRow
                      checked={selectedPerSystemIds.has(candidate.id)}
                      onCheckedChange={() => toggleSetValue(setSelectedPerSystemIds, candidate.id)}
                      title={
                        <EditableName
                          value={perSystemOverrides[candidate.id]?.name ?? candidate.name}
                          onChange={(name) => setPerSystemOverrides((prev) => ({ ...prev, [candidate.id]: { ...prev[candidate.id], name } }))}
                          placeholder={candidate.name}
                        />
                      }
                      description={
                        <EditableTextarea
                          value={(perSystemOverrides[candidate.id]?.description ?? candidate.description) || ''}
                          onChange={(event) => setPerSystemOverrides((prev) => ({ ...prev, [candidate.id]: { ...prev[candidate.id], description: event.target.value } }))}
                          placeholder="Add a description"
                          className="min-h-0 border-none bg-transparent p-0 text-sm text-muted-foreground"
                        />
                      }
                      trailing={alreadyExists ? <Badge variant="secondary">Already added</Badge> : undefined}
                    />
                    {index < perSystemCandidates.length - 1 ? <Separator separatorClass="bg-border" /> : null}
                  </React.Fragment>
                )
              })
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}

const MANUAL_SYSTEM_ID_PREFIX = 'manual-system-'
const isManualSystemId = (id: string) => id.startsWith(MANUAL_SYSTEM_ID_PREFIX)

// collapsed by default so all system details are scannable at a glance
const SystemCandidateCard = ({
  name,
  namePlaceholder,
  description,
  onNameChange,
  onDescriptionChange,
  onRemove,
  alreadyExists,
}: {
  name: string
  namePlaceholder: string
  description: string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onRemove: () => void
  alreadyExists: boolean
}) => {
  const [open, setOpen] = useState(false)

  return (
    <Card>
      <div className="flex items-start justify-between gap-2 px-6 py-3">
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-base font-semibold">
            {name || 'New system'}
            {alreadyExists ? <Badge variant="secondary">Already added</Badge> : null}
          </span>
          {!open && description ? <p className="mt-0.5 line-clamp-3 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" onClick={() => setOpen((value) => !value)}>
            {open ? 'Done' : 'Edit'}
          </Button>
          <Button variant="secondary" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
      {open ? (
        <>
          <Separator separatorClass="bg-border" />
          <div className="space-y-4 px-6 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">System name</label>
              <Input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder={namePlaceholder} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Description <span className="font-normal text-muted-foreground">- Optional</span>
              </label>
              <Textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="Add a short description of this system" />
            </div>
          </div>
        </>
      ) : null}
    </Card>
  )
}

const SystemsStep = ({
  mode,
  systemCandidates,
  systemOverrides,
  setSystemOverrides,
  onAddSystem,
  onRemoveSystem,
  existingSystemNames,
}: {
  mode: PlatformMode
  systemCandidates: SystemCandidate[]
  systemOverrides: OverrideMap
  setSystemOverrides: React.Dispatch<React.SetStateAction<OverrideMap>>
  onAddSystem: () => void
  onRemoveSystem: (id: string) => void
  existingSystemNames: Set<string>
}) => {
  if (mode === 'per-system') {
    return (
      <SectionCard title="System Details" description="Each platform from the previous step will also get a linked System Details record with the same name and description.">
        <EmptyState message="No additional setup is needed here, continue to the next step." />
      </SectionCard>
    )
  }

  const systemDetailsDescription =
    'System details are the applications, services, and capabilities that make up your platform. Review what we found, then edit or remove anything that does not belong.'

  return (
    <div className="space-y-3">
      {systemCandidates.length === 0 ? (
        <SectionCard title="Review your system details" description={systemDetailsDescription}>
          <EmptyState message="No systems were detected in this notification, add one manually below." />
        </SectionCard>
      ) : (
        <SectionCard title="Review your system details" description={systemDetailsDescription}>
          <div className="px-6 py-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Detected system details
              <Badge variant="secondary">{systemCandidates.length}</Badge>
            </div>
            <div className="space-y-3">
              {systemCandidates.map((candidate) => {
                const alreadyExists = existingSystemNames.has(canocalizeLookupValue(systemOverrides[candidate.id]?.name ?? candidate.name))
                return (
                  <SystemCandidateCard
                    key={candidate.id}
                    name={systemOverrides[candidate.id]?.name ?? candidate.name}
                    namePlaceholder={candidate.name || 'e.g. Billing Service'}
                    description={(systemOverrides[candidate.id]?.description ?? candidate.description) || ''}
                    onNameChange={(value) => setSystemOverrides((prev) => ({ ...prev, [candidate.id]: { ...prev[candidate.id], name: value } }))}
                    onDescriptionChange={(value) => setSystemOverrides((prev) => ({ ...prev, [candidate.id]: { ...prev[candidate.id], description: value } }))}
                    onRemove={() => onRemoveSystem(candidate.id)}
                    alreadyExists={alreadyExists}
                  />
                )
              })}
            </div>
          </div>
        </SectionCard>
      )}

      <Button variant="secondary" onClick={onAddSystem}>
        + Add a system
      </Button>
    </div>
  )
}

const DOMAIN_SCAN_PROGRESS_STORAGE_PREFIX = 'domain-discovery-import:'

type PersistedProgress = {
  hasStarted: boolean
  stepId: string
  selectedVendorIds: string[]
  selectedDomainIds: string[]
  selectedFindingIds: string[]
  platformMode: PlatformMode
  singlePlatformOverride: TextOverride
  selectedPerSystemPlatformIds: string[]
  perSystemPlatformOverrides: OverrideMap
  systemOverrides: OverrideMap
  manualSystems: SystemCandidate[]
  removedDetectedSystemIds: string[]
  vendorOverrides: OverrideMap
  domainOverrides: OverrideMap
  findingOverrides: OverrideMap
  platformVendorLinks: Record<string, string[]>
  platformAssetLinks: Record<string, string[]>
  systemVendorLinks: Record<string, string[]>
  systemAssetLinks: Record<string, string[]>
}

const linkSetsToRecord = (links: Record<string, Set<string>>): Record<string, string[]> => Object.fromEntries(Object.entries(links).map(([key, value]) => [key, Array.from(value)]))

const linkSetsFromRecord = (record: Record<string, string[]>): Record<string, Set<string>> => Object.fromEntries(Object.entries(record).map(([key, value]) => [key, new Set(value)]))

// progress is scoped per-scan so "Finish later" on one report never clobbers another
const loadDomainScanProgress = (storageKey: string): PersistedProgress | undefined => {
  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as PersistedProgress) : undefined
  } catch {
    return undefined
  }
}

const saveDomainScanProgress = (storageKey: string, progress: PersistedProgress) => {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(progress))
  } catch {
    // localStorage may be unavailable (private browsing, quota) -- losing the save is acceptable
  }
}

const clearDomainScanProgress = (storageKey: string) => {
  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    // ignore
  }
}

export default function DomainDiscoveryImportPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { notifications } = useNotificationsContext()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: importDomainScanReview, isPending: isImporting } = useImportDomainScanReview()
  const { mutateAsync: updateScan } = useUpdateScan()
  const { data: session } = useSession()
  const stepper = useStepper()
  const scanIdParam = searchParams.get('scanId') ?? searchParams.get('id')
  const matchedNotification = notifications.find((notification) => {
    const data = notification.data as DomainScanNotificationData | undefined
    return notification.id === scanIdParam || data?.scans?.some((scan) => scan.internal_scan_id === scanIdParam)
  })
  const notificationData = matchedNotification?.data as DomainScanNotificationData | undefined
  const { data: scanQuery } = useScan(scanIdParam ?? undefined)

  const vendors = useMemo(() => vendorsFromNotification(notificationData), [notificationData])
  const domains = useMemo(() => domainsFromNotification(notificationData), [notificationData])
  const findings = useMemo(() => findingsFromNotification(notificationData), [notificationData])
  const agentReadiness = notificationData?.findings?.agent_readiness
  const vendorLookupNames = useMemo(() => Array.from(new Set(vendors.flatMap((vendor) => [vendor.name, sanitizeEntityName(vendor.name)]).filter(Boolean))), [vendors])
  const assetLookupNames = useMemo(() => Array.from(new Set([...domains.owned, ...domains.external, ...domains.ip, ...domains.technologies].map((domain) => domain.name).filter(Boolean))), [domains])

  // fetch existing domains and entities to make sure users do not try to bulk import existing ones which
  // would lead to another failure ( duplicates )
  const { vendorNodes } = useVendorsWithFilter({
    where:
      vendorLookupNames.length > 0
        ? {
            or: [{ displayNameIn: vendorLookupNames }, { nameIn: vendorLookupNames }],
          }
        : undefined,
    enabled: vendorLookupNames.length > 0,
  })

  const { assetsNodes } = useAssetsWithFilter({
    where:
      assetLookupNames.length > 0
        ? {
            or: [{ identifierIn: assetLookupNames }, { displayNameIn: assetLookupNames }, { nameIn: assetLookupNames }],
          }
        : undefined,
    enabled: assetLookupNames.length > 0,
  })

  const existingVendorLookup = useMemo(() => {
    const set = new Set<string>()
    vendorNodes.forEach((vendor) => {
      if (vendor.displayName) set.add(canocalizeLookupValue(vendor.displayName))
      if (vendor.name) set.add(canocalizeLookupValue(vendor.name))
    })
    return set
  }, [vendorNodes])

  const existingAssetLookup = useMemo(() => {
    const set = new Set<string>()
    assetsNodes.forEach((asset) => {
      if (asset.identifier) set.add(canocalizeLookupValue(asset.identifier))
      if (asset.displayName) set.add(canocalizeLookupValue(asset.displayName))
      if (asset.name) set.add(canocalizeLookupValue(asset.name))
    })
    return set
  }, [assetsNodes])

  const existingVendorIds = useMemo(
    () =>
      new Set(
        vendors
          .filter((vendor) => existingVendorLookup.has(canocalizeLookupValue(vendor.name)) || existingVendorLookup.has(canocalizeLookupValue(sanitizeEntityName(vendor.name))))
          .map((vendor) => vendor.id),
      ),
    [existingVendorLookup, vendors],
  )

  const allDomains = useMemo(() => [...domains.owned, ...domains.external, ...domains.ip, ...domains.technologies], [domains])

  const singlePlatformCandidate = useMemo(() => platformCandidateFromNotification(notificationData, domains.hostname), [notificationData, domains.hostname])
  const systemCandidates = useMemo(() => systemCandidatesFromNotification(notificationData), [notificationData])
  const perSystemPlatformCandidates = useMemo(() => platformCandidatesFromSystems(systemCandidates), [systemCandidates])

  // fetch existing platforms/systems so a re-run of this wizard doesn't try to create duplicates
  const platformLookupNames = useMemo(
    () => Array.from(new Set([singlePlatformCandidate.name, ...perSystemPlatformCandidates.map((candidate) => candidate.name)].filter(Boolean))),
    [singlePlatformCandidate.name, perSystemPlatformCandidates],
  )
  const systemLookupNames = useMemo(() => Array.from(new Set(systemCandidates.map((candidate) => candidate.name).filter(Boolean))), [systemCandidates])

  const { platformsNodes: existingPlatformNodes } = usePlatformsWithFilter({
    where: platformLookupNames.length > 0 ? { nameIn: platformLookupNames } : undefined,
    enabled: platformLookupNames.length > 0,
  })

  const { systemDetailsNodes: existingSystemNodes } = useSystemDetailsWithFilter({
    where: systemLookupNames.length > 0 ? { systemNameIn: systemLookupNames } : undefined,
    enabled: systemLookupNames.length > 0,
  })

  const existingPlatformNames = useMemo(() => new Set(existingPlatformNodes.map((platform) => canocalizeLookupValue(platform.name)).filter(Boolean)), [existingPlatformNodes])
  const existingSystemNames = useMemo(() => new Set(existingSystemNodes.map((system) => canocalizeLookupValue(system.systemName)).filter(Boolean)), [existingSystemNodes])

  const selectionSeedKey = useMemo(
    () =>
      [
        matchedNotification?.id || scanIdParam || '',
        vendors.map((vendor) => vendor.id).join(','),
        domains.owned.map((domain) => domain.id).join(','),
        domains.external.map((domain) => domain.id).join(','),
        domains.ip.map((domain) => domain.id).join(','),
        domains.technologies.map((domain) => domain.id).join(','),
        findings.map((finding) => finding.id).join(','),
        systemCandidates.map((system) => system.id).join(','),
      ].join('|'),
    [domains.external, domains.ip, domains.owned, domains.technologies, findings, matchedNotification?.id, scanIdParam, systemCandidates, vendors],
  )
  const initializedSelectionKeyRef = useRef('')
  const storageKey = useMemo(() => (scanIdParam ? `${DOMAIN_SCAN_PROGRESS_STORAGE_PREFIX}${scanIdParam}` : undefined), [scanIdParam])

  const existingAssetIds = useMemo(
    () => new Set(allDomains.filter((domain) => existingAssetLookup.has(canocalizeLookupValue(domain.name))).map((domain) => domain.id)),
    [allDomains, existingAssetLookup],
  )

  const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(() => new Set())
  const [selectedDomainIds, setSelectedDomainIds] = useState<Set<string>>(() => new Set())
  const [selectedFindingIds, setSelectedFindingIds] = useState<Set<string>>(() => new Set(findings.map((finding) => finding.id)))

  const [hasStarted, setHasStarted] = useState(false)
  const [platformMode, setPlatformMode] = useState<PlatformMode>('single')
  const [singlePlatformOverride, setSinglePlatformOverride] = useState<TextOverride>({})
  const [selectedPerSystemPlatformIds, setSelectedPerSystemPlatformIds] = useState<Set<string>>(() => new Set())
  const [perSystemPlatformOverrides, setPerSystemPlatformOverrides] = useState<OverrideMap>({})

  const [systemOverrides, setSystemOverrides] = useState<OverrideMap>({})
  const [manualSystems, setManualSystems] = useState<SystemCandidate[]>([])
  const [removedDetectedSystemIds, setRemovedDetectedSystemIds] = useState<Set<string>>(() => new Set())

  const [vendorOverrides, setVendorOverrides] = useState<OverrideMap>({})
  const [domainOverrides, setDomainOverrides] = useState<OverrideMap>({})
  const [findingOverrides, setFindingOverrides] = useState<OverrideMap>({})

  const [platformVendorLinks, setPlatformVendorLinks] = useState<Record<string, Set<string>>>({})
  const [platformAssetLinks, setPlatformAssetLinks] = useState<Record<string, Set<string>>>({})
  const [systemVendorLinks, setSystemVendorLinks] = useState<Record<string, Set<string>>>({})
  const [systemAssetLinks, setSystemAssetLinks] = useState<Record<string, Set<string>>>({})

  // restore progress saved via "Finish later" before the default-selection effect below has a
  // chance to run
  useEffect(() => {
    if (!storageKey || !selectionSeedKey || initializedSelectionKeyRef.current === selectionSeedKey) {
      return
    }

    const saved = loadDomainScanProgress(storageKey)
    if (!saved) {
      return
    }

    initializedSelectionKeyRef.current = selectionSeedKey
    setHasStarted(saved.hasStarted)
    setSelectedVendorIds(new Set(saved.selectedVendorIds))
    setSelectedDomainIds(new Set(saved.selectedDomainIds))
    setSelectedFindingIds(new Set(saved.selectedFindingIds))
    setPlatformMode(saved.platformMode)
    setSinglePlatformOverride(saved.singlePlatformOverride)
    setSelectedPerSystemPlatformIds(new Set(saved.selectedPerSystemPlatformIds))
    setPerSystemPlatformOverrides(saved.perSystemPlatformOverrides)
    setSystemOverrides(saved.systemOverrides)
    setManualSystems(saved.manualSystems)
    setRemovedDetectedSystemIds(new Set(saved.removedDetectedSystemIds))
    setVendorOverrides(saved.vendorOverrides)
    setDomainOverrides(saved.domainOverrides)
    setFindingOverrides(saved.findingOverrides)
    setPlatformVendorLinks(linkSetsFromRecord(saved.platformVendorLinks))
    setPlatformAssetLinks(linkSetsFromRecord(saved.platformAssetLinks))
    setSystemVendorLinks(linkSetsFromRecord(saved.systemVendorLinks))
    setSystemAssetLinks(linkSetsFromRecord(saved.systemAssetLinks))

    const savedStep = stepper.state.all.find((step) => step.id === saved.stepId)
    if (savedStep) {
      stepper.navigation.goTo(savedStep.id)
    }
  }, [selectionSeedKey, stepper, storageKey])

  useEffect(() => {
    if (!selectionSeedKey || initializedSelectionKeyRef.current === selectionSeedKey) {
      return
    }

    initializedSelectionKeyRef.current = selectionSeedKey
    setHasStarted(false)

    setSelectedVendorIds(new Set(vendors.filter((vendor) => vendor.url).map((vendor) => vendor.id)))
    setSelectedDomainIds(new Set([...domains.owned.filter((domain) => domain.primary).map((domain) => domain.id), ...domains.technologies.map((domain) => domain.id)]))
    setSelectedFindingIds(new Set(findings.map((finding) => finding.id)))
    setSelectedPerSystemPlatformIds(new Set(systemCandidates.map((system) => system.id)))
    setRemovedDetectedSystemIds(new Set())
    setManualSystems([])
  }, [domains.owned, domains.technologies, findings, selectionSeedKey, systemCandidates, vendors])

  useEffect(() => {
    setSelectedVendorIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => !existingVendorIds.has(id)))
      return checkSetsUnion(prev, next) ? prev : next
    })
  }, [existingVendorIds])

  useEffect(() => {
    setSelectedDomainIds((prev) => {
      const next = new Set(Array.from(prev).filter((id) => !existingAssetIds.has(id)))
      return checkSetsUnion(prev, next) ? prev : next
    })
  }, [existingAssetIds])

  const selectedVendorObjects = useMemo(() => vendors.filter((vendor) => selectedVendorIds.has(vendor.id) && !existingVendorIds.has(vendor.id)), [existingVendorIds, selectedVendorIds, vendors])
  const selectedDomainObjects = useMemo(() => allDomains.filter((domain) => selectedDomainIds.has(domain.id) && !existingAssetIds.has(domain.id)), [allDomains, existingAssetIds, selectedDomainIds])
  const selectedFindingObjects = useMemo(() => findings.filter((finding) => selectedFindingIds.has(finding.id)), [selectedFindingIds, findings])

  const resolvedSinglePlatformTarget = useMemo(() => withOverride(singlePlatformCandidate, { [singlePlatformCandidate.id]: singlePlatformOverride }), [singlePlatformCandidate, singlePlatformOverride])
  const resolvedPerSystemPlatformTargets = useMemo(
    () => perSystemPlatformCandidates.filter((candidate) => selectedPerSystemPlatformIds.has(candidate.id)).map((candidate) => withOverride(candidate, perSystemPlatformOverrides)),
    [perSystemPlatformCandidates, perSystemPlatformOverrides, selectedPerSystemPlatformIds],
  )
  const platformTargets = platformMode === 'single' ? [resolvedSinglePlatformTarget] : resolvedPerSystemPlatformTargets

  const displaySystemCandidates = useMemo(
    () => [...systemCandidates.filter((candidate) => !removedDetectedSystemIds.has(candidate.id)), ...manualSystems],
    [systemCandidates, removedDetectedSystemIds, manualSystems],
  )

  const resolvedSystemTargets = useMemo(() => displaySystemCandidates.map((candidate) => withOverride(candidate, systemOverrides)), [displaySystemCandidates, systemOverrides])

  const addManualSystem = () => {
    const id = `${MANUAL_SYSTEM_ID_PREFIX}${Date.now()}`
    setManualSystems((prev) => [...prev, { id, name: '', description: '' }])
  }

  const removeSystem = (id: string) => {
    if (isManualSystemId(id)) {
      setManualSystems((prev) => prev.filter((system) => system.id !== id))
    } else {
      setRemovedDetectedSystemIds((prev) => new Set(prev).add(id))
    }
    setSystemOverrides((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  // already-imported vendors/assets are still offered as link targets so they can be attached to
  // new platforms/systems
  const existingVendorLinkItems = useMemo(
    () =>
      vendors.filter((vendor) => existingVendorIds.has(vendor.id)).map((vendor) => ({ id: vendor.id, name: vendor.name, logoUrl: vendor.domain ? logoUrlFromDomain(vendor.domain) : vendor.logoUrl })),
    [existingVendorIds, vendors],
  )
  const existingAssetLinkItems = useMemo(() => allDomains.filter((domain) => existingAssetIds.has(domain.id)).map((domain) => ({ id: domain.id, name: domain.name })), [allDomains, existingAssetIds])

  const linkVendors = useMemo(
    () => [
      ...selectedVendorObjects
        .map((vendor) => withOverride(vendor, vendorOverrides))
        .map((vendor) => ({ id: vendor.id, name: vendor.name, logoUrl: vendor.domain ? logoUrlFromDomain(vendor.domain) : vendor.logoUrl })),
      ...existingVendorLinkItems,
    ],
    [selectedVendorObjects, vendorOverrides, existingVendorLinkItems],
  )
  const linkAssets = useMemo(
    () => [...selectedDomainObjects.map((domain) => withOverride(domain, domainOverrides)).map((domain) => ({ id: domain.id, name: domain.name })), ...existingAssetLinkItems],
    [selectedDomainObjects, domainOverrides, existingAssetLinkItems],
  )

  const confirmFindings = useMemo(
    () => selectedFindingObjects.map((finding) => ({ id: finding.id, name: findingOverrides[finding.id]?.name ?? finding.title })),
    [selectedFindingObjects, findingOverrides],
  )

  const hasImportableSelections = platformTargets.length > 0 || selectedVendorObjects.length > 0 || selectedDomainObjects.length > 0 || selectedFindingObjects.length > 0

  // "Finish later" persists everything entered so far to localStorage, keyed by scan, so the user
  // can pick back up where they left off instead of losing their in-progress selections
  const handleFinishLater = () => {
    if (storageKey) {
      saveDomainScanProgress(storageKey, {
        hasStarted,
        stepId: stepper.state.current.data.id,
        selectedVendorIds: Array.from(selectedVendorIds),
        selectedDomainIds: Array.from(selectedDomainIds),
        selectedFindingIds: Array.from(selectedFindingIds),
        platformMode,
        singlePlatformOverride,
        selectedPerSystemPlatformIds: Array.from(selectedPerSystemPlatformIds),
        perSystemPlatformOverrides,
        systemOverrides,
        manualSystems,
        removedDetectedSystemIds: Array.from(removedDetectedSystemIds),
        vendorOverrides,
        domainOverrides,
        findingOverrides,
        platformVendorLinks: linkSetsToRecord(platformVendorLinks),
        platformAssetLinks: linkSetsToRecord(platformAssetLinks),
        systemVendorLinks: linkSetsToRecord(systemVendorLinks),
        systemAssetLinks: linkSetsToRecord(systemAssetLinks),
      })
    }
    router.push('/notifications')
  }

  if (!notificationData) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <PageHeading eyebrow="Discovery" heading="Domain Discovery Results" />
        <div className="mt-4 rounded-md border border-border p-6">
          <p className="text-base font-medium">This report is no longer available</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {scanQuery?.scan
              ? `The scan for ${scanQuery.scan.target ?? 'this domain'} still exists, but its detailed report is only kept in the notification that delivered it. Try opening it again from the notification bell.`
              : 'Try opening this report again from the notification bell, or re-run the scan.'}
          </p>
          <Button className="mt-4" variant="secondary" onClick={() => router.push('/notifications')}>
            Back to notifications
          </Button>
        </div>
      </div>
    )
  }

  if (!hasStarted) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <PageHeading eyebrow="Discovery" heading="Review what we found" />
        <p className="mt-1 text-sm text-muted-foreground">
          We scanned {domains.hostname} to identify platforms, systems, vendors, assets, and findings that may be part of your organization. Review and edit each section before adding it to Openlane.
        </p>

        <div className="mt-6">
          <ScanFoundSummary hostname={domains.hostname} systemsCount={displaySystemCandidates.length} assetsCount={allDomains.length} vendorsCount={vendors.length} findingsCount={findings.length} />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="secondary" onClick={handleFinishLater}>
            Finish later
          </Button>
          <Button variant="primary" onClick={() => setHasStarted(true)}>
            Get started
          </Button>
        </div>
      </div>
    )
  }

  const handleImport = async () => {
    const scanIds = resolveScanIds(notificationData)
    const scanUrlByDomain = new Map((notificationData.scans || []).map((scan) => [scan.domain?.toLowerCase(), scan.url]))

    // platforms default to "everything linked", so an untouched platform's default set is every
    // linkable vendor/asset ref
    const allSelectedVendorIds = linkVendors.map((vendor) => vendor.id)
    const allSelectedAssetIds = linkAssets.map((asset) => asset.id)

    try {
      const existingLinkedVendors = vendors.filter((vendor) => existingVendorIds.has(vendor.id))
      const vendorInputs: ImportDomainScanReviewVendorInput[] = [...selectedVendorObjects, ...existingLinkedVendors].map((vendor) => {
        const resolved = withOverride(vendor, vendorOverrides)
        return {
          ref: vendor.id,
          name: resolved.name,
          domain: resolved.domain,
          categories: vendor.providedServices.length > 0 ? vendor.providedServices : undefined,
        }
      })

      const existingLinkedAssets = allDomains.filter((domain) => existingAssetIds.has(domain.id))
      const assetInputs: ImportDomainScanReviewAssetInput[] = [...selectedDomainObjects, ...existingLinkedAssets].map((domain) => {
        const resolved = withOverride(domain, domainOverrides)
        return {
          ref: domain.id,
          name: resolved.name,
          identifier: resolved.name,
          website: domain.primary ? scanUrlByDomain.get(domain.name.toLowerCase()) : undefined,
          categories: domain.kind === 'technology' && domain.categories?.length ? domain.categories : undefined,
        }
      })

      const platformInputs: ImportDomainScanReviewPlatformInput[] = platformTargets.map((target) => ({
        ref: target.id,
        name: target.name,
        description: target.description,
        entityRefs: Array.from(getLinkedIds(platformVendorLinks, target.id, allSelectedVendorIds)),
        assetRefs: Array.from(getLinkedIds(platformAssetLinks, target.id, allSelectedAssetIds)),
      }))

      const systemInputs: ImportDomainScanReviewSystemInput[] =
        platformMode === 'single'
          ? resolvedSystemTargets.map((system) => ({
              name: system.name,
              description: system.description,
              platformRefs: [resolvedSinglePlatformTarget.id],
              entityRefs: Array.from(getLinkedIds(systemVendorLinks, system.id, [])),
              assetRefs: Array.from(getLinkedIds(systemAssetLinks, system.id, [])),
            }))
          : platformTargets.map((target) => ({
              name: target.name,
              description: target.description,
              platformRefs: [target.id],
              entityRefs: Array.from(getLinkedIds(platformVendorLinks, target.id, allSelectedVendorIds)),
              assetRefs: Array.from(getLinkedIds(platformAssetLinks, target.id, allSelectedAssetIds)),
            }))

      const findingInputs: ImportDomainScanReviewFindingInput[] = selectedFindingObjects.map((finding) => {
        const override = findingOverrides[finding.id]
        const title = override?.name ?? finding.title
        const description = override?.description !== undefined ? override.description : finding.description
        return {
          category: finding.category,
          description: description ? `${title}\n\n${description}` : title,
          severity: finding.severity,
        }
      })

      await importDomainScanReview({
        input: {
          scanIDs: scanIds,
          platforms: platformInputs.length > 0 ? platformInputs : undefined,
          systems: systemInputs.length > 0 ? systemInputs : undefined,
          vendors: vendorInputs,
          assets: assetInputs,
          findings: findingInputs.length > 0 ? findingInputs : undefined,
        },
      })

      const reviewedByUserID = session?.user?.id
      if (reviewedByUserID) {
        await Promise.all(scanIds.map((scanId) => updateScan({ updateScanId: scanId, input: { reviewedByUserID } })))
      }

      successNotification({
        title: 'Import submitted',
        description: "We're creating everything you selected. You will get a notification once it's ready.",
      })
      if (storageKey) {
        clearDomainScanProgress(storageKey)
      }
      router.push('/notifications')
    } catch (error) {
      errorNotification({
        title: 'Import failed',
        description: parseErrorMessage(error),
      })
    }
  }

  const handleNextButton = () => {
    if (!stepper.state.isLast) {
      stepper.navigation.next()
      return
    }

    void handleImport()
  }

  const handleBack = () => {
    if (stepper.state.isFirst) {
      return
    }

    stepper.navigation.prev()
  }

  const linkPlatformTargets = platformTargets.map((target) => ({ id: target.id, name: target.name, description: target.description }))
  const linkSystemTargets = platformMode === 'single' ? resolvedSystemTargets.map((system) => ({ id: system.id, name: system.name, description: system.description })) : []

  const confirmSystems = platformMode === 'single' ? linkSystemTargets : linkPlatformTargets
  const confirmSystemVendorLinks = platformMode === 'single' ? systemVendorLinks : platformVendorLinks

  const currentStepIndex = stepper.state.all.findIndex((step) => step.id === stepper.state.current.data.id)
  const isConfirmStep = stepper.state.current.data.id === 'confirm'

  return (
    <div className="mx-auto max-w-6xl px-6 py-4">
      <PageHeading eyebrow="Discovery" heading="Review what we found" />
      <p className="mt-1 text-sm text-muted-foreground">
        We scanned {domains.hostname} to identify platforms, systems, vendors, assets, and findings that may be part of your organization. Review and edit each section before adding it to Openlane.
      </p>

      <div className={`mt-6 grid grid-cols-1 gap-6 ${isConfirmStep ? '' : 'lg:grid-cols-[2fr_1fr]'}`}>
        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-3">
            <Badge variant="primary" className="w-fit uppercase tracking-wide border-primary/24">
              Step {currentStepIndex + 1} of {stepper.state.all.length} - {stepper.state.current.data.label}
            </Badge>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all" style={{ width: `${((currentStepIndex + 1) / stepper.state.all.length) * 100}%` }} />
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <Button variant="secondary" onClick={handleFinishLater}>
              Finish later
            </Button>

            <div className="flex items-center gap-3">
              {!stepper.state.isFirst ? (
                <Button variant="secondary" onClick={handleBack}>
                  Back
                </Button>
              ) : null}
              <Button variant="primary" onClick={handleNextButton} loading={isImporting} disabled={isImporting || (stepper.state.isLast && !hasImportableSelections)}>
                {stepper.state.isLast ? 'Import' : 'Save and continue'}
              </Button>
            </div>
          </div>

          {stepper.flow.switch({
            platform: () => (
              <PlatformStep
                mode={platformMode}
                setMode={setPlatformMode}
                hostname={domains.hostname}
                singleCandidate={singlePlatformCandidate}
                singleOverride={singlePlatformOverride}
                setSingleOverride={setSinglePlatformOverride}
                perSystemCandidates={perSystemPlatformCandidates}
                selectedPerSystemIds={selectedPerSystemPlatformIds}
                setSelectedPerSystemIds={setSelectedPerSystemPlatformIds}
                perSystemOverrides={perSystemPlatformOverrides}
                setPerSystemOverrides={setPerSystemPlatformOverrides}
                existingPlatformNames={existingPlatformNames}
              />
            ),
            systems: () => (
              <SystemsStep
                mode={platformMode}
                systemCandidates={displaySystemCandidates}
                systemOverrides={systemOverrides}
                setSystemOverrides={setSystemOverrides}
                onAddSystem={addManualSystem}
                onRemoveSystem={removeSystem}
                existingSystemNames={existingSystemNames}
              />
            ),
            assets: () => (
              <AssetsStep
                owned={domains.owned}
                external={domains.external}
                ip={domains.ip}
                technologies={domains.technologies}
                selected={selectedDomainIds}
                setSelected={setSelectedDomainIds}
                existingIds={existingAssetIds}
                overrides={domainOverrides}
                setOverrides={setDomainOverrides}
              />
            ),
            vendors: () => (
              <VendorsStep
                vendors={vendors}
                selected={selectedVendorIds}
                setSelected={setSelectedVendorIds}
                existingIds={existingVendorIds}
                overrides={vendorOverrides}
                setOverrides={setVendorOverrides}
              />
            ),
            link: () => (
              <LinkStep
                platforms={linkPlatformTargets}
                systems={linkSystemTargets}
                vendors={linkVendors}
                assets={linkAssets}
                vendorLinks={platformVendorLinks}
                setVendorLinks={setPlatformVendorLinks}
                assetLinks={platformAssetLinks}
                setAssetLinks={setPlatformAssetLinks}
                systemVendorLinks={systemVendorLinks}
                setSystemVendorLinks={setSystemVendorLinks}
                systemAssetLinks={systemAssetLinks}
                setSystemAssetLinks={setSystemAssetLinks}
              />
            ),
            findings: () => (
              <FindingsStep
                findings={findings}
                selected={selectedFindingIds}
                setSelected={setSelectedFindingIds}
                agentReadiness={agentReadiness}
                overrides={findingOverrides}
                setOverrides={setFindingOverrides}
              />
            ),
            confirm: () => (
              <ConfirmStep
                platforms={linkPlatformTargets}
                systems={confirmSystems}
                vendors={linkVendors}
                assets={linkAssets}
                findings={confirmFindings}
                platformVendorLinks={platformVendorLinks}
                systemVendorLinks={confirmSystemVendorLinks}
                systemVendorLinksDefaultToAll={platformMode !== 'single'}
                onEditStep={(stepId) => stepper.navigation.goTo(stepId)}
              />
            ),
          })}
        </div>

        {!isConfirmStep ? (
          <div>
            <ScanSummarySidebar
              platforms={linkPlatformTargets}
              systems={confirmSystems}
              vendors={linkVendors}
              assets={linkAssets}
              findings={confirmFindings}
              onEditStep={(stepId) => stepper.navigation.goTo(stepId)}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
