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
} as const

export type DomainScanFindingCategoryValue = (typeof DomainScanFindingCategory)[keyof typeof DomainScanFindingCategory]

export type Finding = {
  id: string
  title: string
  description?: string
  severity?: string
  category: DomainScanFindingCategoryValue
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

export const DOMAIN_SCAN_STEP_IDS = ['platform', 'systems', 'assets', 'vendors', 'link', 'findings', 'confirm'] as const

export type StepId = (typeof DOMAIN_SCAN_STEP_IDS)[number]

export const isStepId = (value: string): value is StepId => DOMAIN_SCAN_STEP_IDS.some((stepId) => stepId === value)

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
  }
}

export type DomainScanDomains = {
  owned: DomainItem[]
  external: DomainItem[]
  ip: DomainItem[]
  technologies: DomainItem[]
  hostname: string
}
