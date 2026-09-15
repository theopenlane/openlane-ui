import { toHumanLabel } from '@/utils/strings'
import { type PostureStatus } from '@/components/shared/enum-mapper/scan-enum'

export { type PostureStatus }

export const OPENLANE_DOMAIN_SCAN_PERFORMER = 'openlane_domain_scan'

export type Vendor = { url?: string; name?: string; categories?: string[] }
type System = { description?: string; system_name?: string }

type AgentReadiness = {
  level?: number
  level_name?: string
  checklist?: string
  reference?: string
  domain?: string
}

type Findings = {
  risks?: unknown[]
  agent_readiness?: AgentReadiness[]
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

type EmailAuth = {
  spf_record?: string
  spf_policy?: string
  dmarc_record?: string
  dmarc_policy?: string
  dmarc_subdomain_policy?: string
  dmarc_percentage?: number
  dmarc_reporting_uris?: string[]
  dkim_selectors?: string[]
  mx_hosts?: string[]
}

type SecurityTxt = {
  present?: boolean
  url?: string
  contacts?: string[]
  policy?: string
  encryption?: string
  preferred_languages?: string[]
  expires?: string
  expired?: boolean
}

type RobotsTxt = {
  present?: boolean
  content_signals?: Record<string, string>
  disallowed_ai_crawlers?: string[]
  named_ai_crawlers?: string[]
  sitemaps?: string[]
}

type LLMsTxt = {
  present?: boolean
  url?: string
  title?: string
  summary?: string
  section_count?: number
  full_present?: boolean
}

type TransportSecurity = {
  https_reachable?: boolean
  redirects_to_https?: boolean
  hsts?: boolean
  hsts_max_age?: number
  hsts_include_subdomains?: boolean
  hsts_preload?: boolean
}

type WellKnown = {
  security_txt?: SecurityTxt
  robots_txt?: RobotsTxt
  llms_txt?: LLMsTxt
  transport?: TransportSecurity
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
  email_auth?: EmailAuth
  well_known?: WellKnown
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
  const readiness = metadata?.findings?.agent_readiness?.[0]
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

// hasFindingsSummary gates the findings card. Email authentication counts towards it even
// though it is not part of Findings server-side: a domain with no DMARC record has a finding
// worth showing whether or not the scanner produced anything else
export const hasFindingsSummary = (metadata: ScanMetadata | null): boolean =>
  (!!metadata?.findings && (!!metadata.findings.agent_readiness?.length || !!metadata.findings.missing_compliance_links)) || hasEmailAuth(metadata) || hasWebPosture(metadata)

export const hasCompanyInfo = (metadata: ScanMetadata | null): boolean => {
  const company = getCompanyInfo(metadata)
  return !!company && (!!company.description || company.isSoc2 !== undefined || company.socialLinks.length > 0)
}

export type PostureRow = { key: string; label: string; status: PostureStatus; value: string; detail?: string }

const DMARC_FULL_PERCENTAGE = 100

const describeSPF = (auth: EmailAuth): PostureRow => {
  if (!auth.spf_record) {
    return { key: 'spf', label: 'SPF', status: 'bad', value: 'Not published', detail: 'Nothing declares which servers may send mail as this domain.' }
  }

  switch (auth.spf_policy) {
    case 'hard_fail':
      return { key: 'spf', label: 'SPF', status: 'good', value: 'Published, hard fail (-all)', detail: 'No issues found.' }
    case 'soft_fail':
      return { key: 'spf', label: 'SPF', status: 'good', value: 'Published, soft fail (~all)', detail: 'No issues found.' }
    case 'neutral':
      return { key: 'spf', label: 'SPF', status: 'warn', value: 'Published, neutral (?all)', detail: 'A neutral qualifier asserts nothing about unlisted senders.' }
    case 'pass_all':
      return { key: 'spf', label: 'SPF', status: 'bad', value: 'Published, passes any sender (+all)', detail: 'Every server on the internet passes SPF for this domain.' }
    default:
      return { key: 'spf', label: 'SPF', status: 'warn', value: 'Published, no all mechanism', detail: 'Without a trailing all mechanism the record has no default.' }
  }
}

const describeDMARC = (auth: EmailAuth): PostureRow => {
  if (!auth.dmarc_record || !auth.dmarc_policy) {
    return { key: 'dmarc', label: 'DMARC', status: 'bad', value: 'Not published', detail: 'Nothing tells receiving servers what to do with mail that fails authentication.' }
  }

  const pct = auth.dmarc_percentage ?? DMARC_FULL_PERCENTAGE
  const sampled = pct < DMARC_FULL_PERCENTAGE
  const details: string[] = []

  if (sampled) {
    details.push(`Applied to ${pct}% of failing mail (pct=${pct}), so ${DMARC_FULL_PERCENTAGE - pct}% is delivered unenforced.`)
  }

  if (auth.dmarc_subdomain_policy && auth.dmarc_subdomain_policy !== auth.dmarc_policy) {
    details.push(`Subdomains use sp=${auth.dmarc_subdomain_policy}.`)
  }

  if (!auth.dmarc_reporting_uris?.length) {
    details.push('No aggregate report address (rua=), so failures are not being watched.')
  }

  const detail = details.join(' ') || undefined

  if (auth.dmarc_policy === 'none') {
    return { key: 'dmarc', label: 'DMARC', status: 'warn', value: 'Monitoring only (p=none)', detail: detail ?? 'Failing mail is still delivered.' }
  }

  return {
    key: 'dmarc',
    label: 'DMARC',
    status: sampled ? 'warn' : 'good',
    value: `p=${auth.dmarc_policy}${sampled ? ` at ${pct}%` : ''}`,
    detail,
  }
}

const describeDKIM = (auth: EmailAuth): PostureRow => {
  const selectors = auth.dkim_selectors ?? []

  if (!selectors.length) {
    return { key: 'dkim', label: 'DKIM', status: 'info', value: 'No common selector found', detail: 'Only conventional selector names are probed, so this is suggestive rather than conclusive.' }
  }

  return { key: 'dkim', label: 'DKIM', status: 'good', value: `${selectors.length} selector${selectors.length === 1 ? '' : 's'} published`, detail: selectors.join(', ') }
}

export const getEmailAuthRows = (metadata: ScanMetadata | null): PostureRow[] => {
  const auth = metadata?.email_auth
  if (!auth) {
    return []
  }

  const rows = [describeDMARC(auth), describeSPF(auth), describeDKIM(auth)]

  if (auth.mx_hosts?.length) {
    rows.push({ key: 'mx', label: 'Mail exchangers', status: 'info', value: `${auth.mx_hosts.length} host${auth.mx_hosts.length === 1 ? '' : 's'}`, detail: auth.mx_hosts.join(', ') })
  }

  return rows
}

export const getWellKnownRows = (metadata: ScanMetadata | null): PostureRow[] => {
  const wellKnown = metadata?.well_known
  if (!wellKnown) {
    return []
  }

  const rows: PostureRow[] = []
  const security = wellKnown.security_txt

  if (security?.present) {
    rows.push({
      key: 'security_txt',
      label: 'security.txt',
      status: security.expired ? 'warn' : 'good',
      value: security.expired ? 'Published but expired' : 'Published',
      detail: [security.contacts?.length ? `Contact: ${security.contacts.join(', ')}` : '', security.policy ? `Policy: ${security.policy}` : ''].filter(Boolean).join(' · ') || undefined,
    })
  } else {
    rows.push({ key: 'security_txt', label: 'security.txt', status: 'warn', value: 'Not published', detail: 'A researcher who finds something has nowhere to send it.' })
  }

  const robots = wellKnown.robots_txt

  if (robots?.present) {
    const signals = Object.entries(robots.content_signals ?? {})
    const named = robots.named_ai_crawlers?.length ?? 0
    const blocked = robots.disallowed_ai_crawlers?.length ?? 0
    const detail = [
      signals.length ? `Content-Signal: ${signals.map(([key, value]) => `${key}=${value}`).join(', ')}` : '',
      named ? `${blocked} of ${named} named AI crawlers fully disallowed` : 'No AI crawlers named',
    ]
      .filter(Boolean)
      .join(' · ')

    rows.push({ key: 'robots_txt', label: 'robots.txt', status: signals.length || blocked ? 'good' : 'info', value: 'Published', detail })
  } else {
    rows.push({ key: 'robots_txt', label: 'robots.txt', status: 'info', value: 'Not published' })
  }

  const llms = wellKnown.llms_txt

  rows.push({
    key: 'llms_txt',
    label: 'llms.txt',
    status: llms?.present ? 'good' : 'info',
    value: llms?.present ? `Published${llms.full_present ? ', with llms-full.txt' : ''}` : 'Not published',
    detail: llms?.present ? [llms.title, llms.section_count ? `${llms.section_count} sections` : ''].filter(Boolean).join(' · ') || undefined : undefined,
  })

  const transport = wellKnown.transport

  if (transport) {
    const days = transport.hsts_max_age ? Math.round(transport.hsts_max_age / 86400) : 0
    const detail = [
      transport.redirects_to_https ? 'HTTP redirects to HTTPS' : 'Plain HTTP does not redirect to HTTPS',
      transport.hsts_include_subdomains ? 'includeSubDomains' : '',
      transport.hsts_preload ? 'preload' : '',
    ]
      .filter(Boolean)
      .join(' · ')

    rows.push({
      key: 'transport',
      label: 'HTTPS and HSTS',
      status: transport.hsts && transport.redirects_to_https ? 'good' : 'warn',
      value: transport.hsts ? `HSTS for ${days} day${days === 1 ? '' : 's'}` : 'No HSTS header',
      detail,
    })
  }

  return rows
}

// getEmailAuthIssues returns only the email authentication rows that need attention, so the
// findings summary can count them without repeating the interpretation in describeDMARC and
// its siblings. An "info" row is excluded: an unfound DKIM selector is inconclusive rather
// than wrong, since only conventional selector names are probed
export const getEmailAuthIssues = (metadata: ScanMetadata | null): PostureRow[] => getEmailAuthRows(metadata).filter((row) => row.status === 'warn' || row.status === 'bad')

export const hasEmailAuth = (metadata: ScanMetadata | null): boolean => getEmailAuthRows(metadata).length > 0

// getWebPostureIssues returns only the well-known file and transport rows that need attention
export const getWebPostureIssues = (metadata: ScanMetadata | null): PostureRow[] => getWellKnownRows(metadata).filter((row) => row.status === 'warn' || row.status === 'bad')

export const hasWebPosture = (metadata: ScanMetadata | null): boolean => getWellKnownRows(metadata).length > 0
