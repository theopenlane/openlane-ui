export type Vendor = {
  id: string
  name: string
  legalName?: string
  providedServices: string[]
  url?: string
  domain?: string
  logoUrl?: string
}

export type DomainItem = {
  id: string
  name: string
  primary?: boolean
  kind?: 'ip' | 'technology'
  org?: string
  categories?: string[]
  vendor?: string
}

export const DomainScanFindingCategory = {
  RISK: 'RISK',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION',
  AGENT_READINESS: 'AGENT_READINESS',
  COMPLIANCE_LINKS: 'COMPLIANCE_LINKS',
  EMAIL_AUTHENTICATION: 'EMAIL_AUTHENTICATION',
  WEB_POSTURE: 'WEB_POSTURE',
} as const

export type DomainScanFindingCategoryValue = (typeof DomainScanFindingCategory)[keyof typeof DomainScanFindingCategory]

export type Finding = {
  id: string
  title: string
  description?: string
  severity?: string
  category: DomainScanFindingCategoryValue
  // category sent on import when it should be more specific than the review grouping, e.g. DMARC under EMAIL_AUTHENTICATION
  importCategory?: string
  // domain the finding was raised against, used to group the review list per domain
  domain?: string
}

export type PlatformMode = 'single' | 'per-system'

export type PlatformCandidate = {
  id: string
  name: string
  description?: string
}

export type SystemCandidate = {
  id: string
  name: string
  description?: string
}

export type TextOverride = { name?: string; description?: string; domain?: string }

export type OverrideMap = Record<string, TextOverride>

export type LinkableItem = { id: string; name: string; logoUrl?: string }

export type DomainScanSummaryItem = LinkableItem & { description?: string; linkedVendorNames?: string[] }

export type DomainScanSummarySection = {
  stepId: EditableStepId
  title: string
  items: DomainScanSummaryItem[]
}

export const DOMAIN_SCAN_STEPS = [
  { id: 'platform', label: 'Platform' },
  { id: 'systems', label: 'System Details' },
  { id: 'assets', label: 'Assets' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'link', label: 'Link' },
  { id: 'findings', label: 'Findings' },
  { id: 'confirm', label: 'Confirm' },
] as const

export type StepId = (typeof DOMAIN_SCAN_STEPS)[number]['id']

export const isStepId = (value: string): value is StepId => DOMAIN_SCAN_STEPS.some((step) => step.id === value)

export type EditableStepId = Extract<StepId, 'platform' | 'systems' | 'assets' | 'vendors' | 'findings'>

export type DomainScanVendorPayload = {
  name?: string
  legal_name?: string
  url?: string
  categories?: string[]
}

export type DomainScanDnsRecordPayload = {
  domain?: string
  vendor?: string
}

export type DomainScanIpAddressPayload = {
  address?: string
  org?: string
}

export type DomainScanFindingPayload = {
  id?: string
  title?: string
  description?: string
  severity?: string
  name?: string
  summary?: string
  details?: string
}

export type DomainScanAgentReadinessPayload = {
  level?: number
  level_name?: string
  checklist?: string
  domain?: string
}

export type DomainScanPosturePayload = {
  check?: string
  title?: string
  description?: string
  severity?: string
  domain?: string
}

export type DomainScanPlatformPayload = {
  name?: string
  description?: string
}

export type DomainScanSystemPayload = {
  system_name?: string
  description?: string
}

export type DomainScanResult = {
  domain: string
  internal_scan_id: string
  external_scan_id?: string
  url?: string
  status: string
}

export type DomainScanNotificationData = {
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
    missing_compliance_links?: string
    posture?: DomainScanPosturePayload[]
  }
}

export type DomainScanDomains = {
  owned: DomainItem[]
  external: DomainItem[]
  ip: DomainItem[]
  technologies: DomainItem[]
  hostname: string
}
