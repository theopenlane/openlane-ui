import { pluralizeWithCount, toHumanLabel } from '@/utils/strings'
import { isPostureIssue, PostureStatus } from '@/components/shared/enum-mapper/scan-enum'

export const OPENLANE_DOMAIN_SCAN_PERFORMER = 'openlane_domain_scan'

const DETAIL_SEPARATOR = ' · '
const UNKNOWN_GROUP_LABEL = 'Unknown'
const FRAMEWORKS_ENTRY_KEY = 'frameworks'
const SECONDS_PER_DAY = 86400
const DMARC_FULL_PERCENTAGE = 100

const joinDetails = (parts: Array<string | undefined | false>): string | undefined => parts.filter(Boolean).join(DETAIL_SEPARATOR) || undefined

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
      .join(DETAIL_SEPARATOR)
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
    const groupLabel = groupValue !== null && groupValue !== undefined && groupValue !== '' ? String(groupValue) : UNKNOWN_GROUP_LABEL
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
    entries.push({ key: FRAMEWORKS_ENTRY_KEY, label: 'Frameworks Identified', count: frameworks.length, items: frameworks })
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

export const hasFindingsSummary = (metadata: ScanMetadata | null): boolean =>
  (!!metadata?.findings && (!!metadata.findings.agent_readiness?.length || !!metadata.findings.missing_compliance_links)) || hasEmailAuth(metadata) || hasWebPosture(metadata)

export const hasCompanyInfo = (metadata: ScanMetadata | null): boolean => {
  const company = getCompanyInfo(metadata)
  return !!company && (!!company.description || company.isSoc2 !== undefined || company.socialLinks.length > 0)
}

export type PostureRow = { key: string; label: string; status: PostureStatus; value: string; detail?: string }

type PostureVerdict = Pick<PostureRow, 'status' | 'value' | 'detail'>

const POSTURE_CHECKS = {
  spf: 'SPF',
  dmarc: 'DMARC',
  dkim: 'DKIM',
  mx: 'Mail exchangers',
  security_txt: 'security.txt',
  robots_txt: 'robots.txt',
  llms_txt: 'llms.txt',
  transport: 'HTTPS and HSTS',
} as const

type PostureCheck = keyof typeof POSTURE_CHECKS

const postureRow = (key: PostureCheck, verdict: PostureVerdict): PostureRow => ({ key, label: POSTURE_CHECKS[key], ...verdict })

const SPF_MISSING: PostureVerdict = { status: PostureStatus.Bad, value: 'Not published', detail: 'Nothing declares which servers may send mail as this domain.' }

const SPF_NO_ALL: PostureVerdict = { status: PostureStatus.Warn, value: 'Published, no all mechanism', detail: 'Without a trailing all mechanism the record has no default.' }

const SPF_POLICY_VERDICTS: Record<string, PostureVerdict> = {
  hard_fail: { status: PostureStatus.Good, value: 'Published, hard fail (-all)', detail: 'No issues found.' },
  soft_fail: { status: PostureStatus.Good, value: 'Published, soft fail (~all)', detail: 'No issues found.' },
  neutral: { status: PostureStatus.Warn, value: 'Published, neutral (?all)', detail: 'A neutral qualifier asserts nothing about unlisted senders.' },
  pass_all: { status: PostureStatus.Bad, value: 'Published, passes any sender (+all)', detail: 'Every server on the internet passes SPF for this domain.' },
}

const describeSPF = (auth: EmailAuth): PostureRow => {
  if (!auth.spf_record) {
    return postureRow('spf', SPF_MISSING)
  }
  return postureRow('spf', SPF_POLICY_VERDICTS[auth.spf_policy ?? ''] ?? SPF_NO_ALL)
}

const DMARC_MISSING: PostureVerdict = { status: PostureStatus.Bad, value: 'Not published', detail: 'Nothing tells receiving servers what to do with mail that fails authentication.' }

const describeDMARC = (auth: EmailAuth): PostureRow => {
  if (!auth.dmarc_record || !auth.dmarc_policy) {
    return postureRow('dmarc', DMARC_MISSING)
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
    return postureRow('dmarc', { status: PostureStatus.Warn, value: 'Monitoring only (p=none)', detail: detail ?? 'Failing mail is still delivered.' })
  }

  return postureRow('dmarc', { status: sampled ? PostureStatus.Warn : PostureStatus.Good, value: `p=${auth.dmarc_policy}${sampled ? ` at ${pct}%` : ''}`, detail })
}

const DKIM_MISSING: PostureVerdict = {
  status: PostureStatus.Info,
  value: 'No common selector found',
  detail: 'Only conventional selector names are probed, so this is suggestive rather than conclusive.',
}

const describeDKIM = (auth: EmailAuth): PostureRow => {
  const selectors = auth.dkim_selectors ?? []

  if (!selectors.length) {
    return postureRow('dkim', DKIM_MISSING)
  }

  return postureRow('dkim', { status: PostureStatus.Good, value: `${pluralizeWithCount(selectors.length, 'selector')} published`, detail: selectors.join(', ') })
}

export const getEmailAuthRows = (metadata: ScanMetadata | null): PostureRow[] => {
  const auth = metadata?.email_auth
  if (!auth) {
    return []
  }

  const rows = [describeDMARC(auth), describeSPF(auth), describeDKIM(auth)]

  if (auth.mx_hosts?.length) {
    rows.push(postureRow('mx', { status: PostureStatus.Info, value: pluralizeWithCount(auth.mx_hosts.length, 'host'), detail: auth.mx_hosts.join(', ') }))
  }

  return rows
}

const SECURITY_TXT_MISSING: PostureVerdict = { status: PostureStatus.Warn, value: 'Not published', detail: 'A researcher who finds something has nowhere to send it.' }

const describeSecurityTxt = (security?: SecurityTxt): PostureRow => {
  if (!security?.present) {
    return postureRow('security_txt', SECURITY_TXT_MISSING)
  }

  return postureRow('security_txt', {
    status: security.expired ? PostureStatus.Warn : PostureStatus.Good,
    value: security.expired ? 'Published but expired' : 'Published',
    detail: joinDetails([security.contacts?.length ? `Contact: ${security.contacts.join(', ')}` : '', security.policy ? `Policy: ${security.policy}` : '']),
  })
}

const ROBOTS_TXT_MISSING: PostureVerdict = { status: PostureStatus.Info, value: 'Not published' }

const describeRobotsTxt = (robots?: RobotsTxt): PostureRow => {
  if (!robots?.present) {
    return postureRow('robots_txt', ROBOTS_TXT_MISSING)
  }

  const signals = Object.entries(robots.content_signals ?? {})
  const named = robots.named_ai_crawlers?.length ?? 0
  const blocked = robots.disallowed_ai_crawlers?.length ?? 0

  return postureRow('robots_txt', {
    status: signals.length || blocked ? PostureStatus.Good : PostureStatus.Info,
    value: 'Published',
    detail: joinDetails([
      signals.length ? `Content-Signal: ${signals.map(([key, value]) => `${key}=${value}`).join(', ')}` : '',
      named ? `${blocked} of ${named} named AI crawlers fully disallowed` : 'No AI crawlers named',
    ]),
  })
}

const LLMS_TXT_MISSING: PostureVerdict = { status: PostureStatus.Info, value: 'Not published' }

const describeLLMsTxt = (llms?: LLMsTxt): PostureRow => {
  if (!llms?.present) {
    return postureRow('llms_txt', LLMS_TXT_MISSING)
  }

  return postureRow('llms_txt', {
    status: PostureStatus.Good,
    value: `Published${llms.full_present ? ', with llms-full.txt' : ''}`,
    detail: joinDetails([llms.title, llms.section_count ? `${llms.section_count} sections` : '']),
  })
}

const describeTransport = (transport: TransportSecurity): PostureRow => {
  const days = transport.hsts_max_age ? Math.round(transport.hsts_max_age / SECONDS_PER_DAY) : 0

  return postureRow('transport', {
    status: transport.hsts && transport.redirects_to_https ? PostureStatus.Good : PostureStatus.Warn,
    value: transport.hsts ? `HSTS for ${pluralizeWithCount(days, 'day')}` : 'No HSTS header',
    detail: joinDetails([
      transport.redirects_to_https ? 'HTTP redirects to HTTPS' : 'Plain HTTP does not redirect to HTTPS',
      transport.hsts_include_subdomains && 'includeSubDomains',
      transport.hsts_preload && 'preload',
    ]),
  })
}

export const getWellKnownRows = (metadata: ScanMetadata | null): PostureRow[] => {
  const wellKnown = metadata?.well_known
  if (!wellKnown) {
    return []
  }

  const rows = [describeSecurityTxt(wellKnown.security_txt), describeRobotsTxt(wellKnown.robots_txt), describeLLMsTxt(wellKnown.llms_txt)]

  if (wellKnown.transport) {
    rows.push(describeTransport(wellKnown.transport))
  }

  return rows
}

const issueRows = (rows: PostureRow[]): PostureRow[] => rows.filter((row) => isPostureIssue(row.status))

export const getEmailAuthIssues = (metadata: ScanMetadata | null): PostureRow[] => issueRows(getEmailAuthRows(metadata))

export const hasEmailAuth = (metadata: ScanMetadata | null): boolean => !!metadata?.email_auth

export const getWebPostureIssues = (metadata: ScanMetadata | null): PostureRow[] => issueRows(getWellKnownRows(metadata))

export const hasWebPosture = (metadata: ScanMetadata | null): boolean => !!metadata?.well_known
