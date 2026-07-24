import { toHumanLabel } from '@/utils/strings'

export const OPENLANE_DOMAIN_SCAN_PERFORMER = 'openlane_domain_scan'

export type Vendor = { url?: string; name?: string; categories?: string[] }
type System = { description?: string; system_name?: string }

type AgentReadiness = {
  level?: number
  level_name?: string
  checklist?: string
  reference?: string
}

type Findings = {
  risks?: unknown[]
  agent_readiness?: AgentReadiness
  security_violations?: unknown[]
  missing_compliance_links?: string
}

type Compliance = {
  is_soc2?: boolean
  controls?: string[]
  frameworks?: string[]
  trust_center_hosted_by?: string
}

type Platform = {
  name?: string
  industry?: string
  description?: string
  status_page_url?: string
  social_links?: Record<string, string>
}

export type ScanMetadata = {
  url?: string
  external_scan_id?: string
  assets?: Record<string, unknown>
  systems?: System[]
  vendors?: Vendor[]
  findings?: Findings
  platform?: Platform
  compliance?: Compliance
}

export type DiscoveryGroup = { label: string; items: string[] }

export type DiscoveryEntry = { key: string; label: string; count: number; items: string[]; groups?: DiscoveryGroup[] }

export type SocialLink = { platform: string; url: string }

export const parseScanMetadata = (metadata: unknown): ScanMetadata | null => {
  if (!metadata || typeof metadata !== 'object') {
    return null
  }
  return metadata as ScanMetadata
}

const parseChecklist = (checklist?: string): string[] => {
  if (!checklist) {
    return []
  }
  return checklist
    .split('\n')
    .map((line) => line.replace(/^- \[[ xX]\]\s*/, '').trim())
    .filter(Boolean)
}

const summarizeValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>)
      .filter((v) => v !== null && v !== undefined && typeof v !== 'object')
      .map(String)
      .join(' · ')
  }
  return String(value)
}

const groupRecordsByField = (records: unknown[], groupField: string, valueField: string): DiscoveryGroup[] => {
  const groups = new Map<string, string[]>()
  records.forEach((record) => {
    if (!record || typeof record !== 'object') {
      return
    }
    const rec = record as Record<string, unknown>
    const groupValue = rec[groupField]
    const groupLabel = groupValue !== null && groupValue !== undefined && groupValue !== '' ? String(groupValue) : 'Unknown'
    const value = summarizeValue(rec[valueField] ?? rec)
    if (!value) {
      return
    }
    const items = groups.get(groupLabel) ?? []
    items.push(value)
    groups.set(groupLabel, items)
  })
  return Array.from(groups.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([label, items]) => ({ label, items }))
}

const GROUPED_ASSET_FIELDS: Record<string, { groupField: string; valueField: string; groupLabelSuffix?: string; uppercaseGroupLabel?: boolean }> = {
  dns_records: { groupField: 'type', valueField: 'domain', groupLabelSuffix: ' Records', uppercaseGroupLabel: true },
  ip_addresses: { groupField: 'org', valueField: 'address', uppercaseGroupLabel: true },
}

export const getAgentReadiness = (metadata: ScanMetadata | null) => {
  const readiness = metadata?.findings?.agent_readiness
  if (!readiness || readiness.level === undefined) {
    return null
  }
  return {
    level: readiness.level,
    levelName: readiness.level_name ?? '',
    reference: readiness.reference,
    checklist: parseChecklist(readiness.checklist),
  }
}

export const getMissingComplianceLinks = (metadata: ScanMetadata | null): string[] => parseChecklist(metadata?.findings?.missing_compliance_links)

export const getSecurityViolations = (metadata: ScanMetadata | null): unknown[] => metadata?.findings?.security_violations ?? []

export const getRisks = (metadata: ScanMetadata | null): unknown[] => metadata?.findings?.risks ?? []

export const getFrameworks = (metadata: ScanMetadata | null): string[] => metadata?.compliance?.frameworks ?? []

export const getDiscoveryEntries = (metadata: ScanMetadata | null): DiscoveryEntry[] => {
  const entries: DiscoveryEntry[] = []

  Object.entries(metadata?.assets ?? {}).forEach(([key, value]) => {
    const groupConfig = GROUPED_ASSET_FIELDS[key]

    if (groupConfig && Array.isArray(value)) {
      const groups = groupRecordsByField(value, groupConfig.groupField, groupConfig.valueField).map((group) => {
        const fullLabel = `${group.label}${groupConfig.groupLabelSuffix ?? ''}`
        return { ...group, label: groupConfig.uppercaseGroupLabel ? fullLabel.toUpperCase() : fullLabel }
      })
      const count = groups.reduce((sum, group) => sum + group.items.length, 0)
      if (count) {
        entries.push({ key, label: toHumanLabel(key), count, items: [], groups })
      }
      return
    }

    const items = (Array.isArray(value) ? value.map(summarizeValue) : [summarizeValue(value)]).filter(Boolean)
    if (items.length) {
      entries.push({ key, label: toHumanLabel(key), count: items.length, items })
    }
  })

  const frameworks = getFrameworks(metadata)
  if (frameworks.length) {
    entries.push({ key: 'frameworks', label: 'Frameworks Identified', count: frameworks.length, items: frameworks })
  }

  return entries
}

export const getCompanyInfo = (metadata: ScanMetadata | null) => {
  const platform = metadata?.platform
  if (!platform) {
    return null
  }

  const socialLinks: SocialLink[] = Object.entries(platform.social_links ?? {})
    .filter(([, url]) => !!url)
    .map(([key, url]) => ({ platform: key, url }))

  return {
    name: platform.name,
    industry: platform.industry,
    description: platform.description,
    isSoc2: metadata?.compliance?.is_soc2,
    socialLinks,
  }
}

export const getVendors = (metadata: ScanMetadata | null): Vendor[] => metadata?.vendors ?? []

export const hasFindingsSummary = (metadata: ScanMetadata | null): boolean => !!metadata?.findings && (!!metadata.findings.agent_readiness || !!metadata.findings.missing_compliance_links)

export const hasCompanyInfo = (metadata: ScanMetadata | null): boolean => {
  const company = getCompanyInfo(metadata)
  return !!company && (!!company.description || company.isSoc2 !== undefined || company.socialLinks.length > 0)
}
