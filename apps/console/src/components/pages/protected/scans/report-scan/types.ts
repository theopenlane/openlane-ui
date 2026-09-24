export const REPORT_SCAN_STEPS = [
  { id: 'platforms', label: 'Platforms' },
  { id: 'systems', label: 'System Details' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'assets', label: 'Assets' },
  { id: 'groups', label: 'Groups' },
  { id: 'controls', label: 'Controls' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'findings', label: 'Findings' },
  { id: 'program', label: 'Program' },
  { id: 'confirm', label: 'Confirm' },
] as const

export type ReportStepId = (typeof REPORT_SCAN_STEPS)[number]['id']

export type ReportSectionId = Exclude<ReportStepId, 'program' | 'confirm'>

export const REPORT_SECTION_IDS = REPORT_SCAN_STEPS.map((step) => step.id).filter((id): id is ReportSectionId => id !== 'program' && id !== 'confirm')

export const isReportStepId = (value: string): value is ReportStepId => REPORT_SCAN_STEPS.some((step) => step.id === value)

export type ReportPlatformFields = {
  name: string
  description: string
  businessPurpose: string
  environmentName: string
  scopeName: string
  region: string
  physicalLocation: string
  containsPii: boolean
}

export type ReportSystemFields = Pick<ReportPlatformFields, 'name' | 'description'>

export type ReportPlatform = ReportPlatformFields & { id: string }

export type ReportSystem = ReportSystemFields & { id: string; platformId?: string }

export type ReportVendor = {
  id: string
  name: string
  displayName?: string
  description?: string
  domains: string[]
  providedServices: string[]
  hasSoc2?: boolean
  ssoEnforced?: boolean
  mfaSupported?: boolean
  mfaEnforced?: boolean
  statusPageURL?: string
}

export type ReportAsset = {
  id: string
  name: string
  displayName?: string
  description?: string
  assetType?: string
  containsPii?: boolean
  physicalLocation?: string
  region?: string
  categories: string[]
  vendorName?: string
  vendorId?: string
}

export type ReportGroup = {
  id: string
  name: string
  displayName?: string
  description?: string
}

export type ReportControl = {
  id: string
  refCode: string
  title?: string
  description?: string
  auditorReferenceID?: string
  category?: string
  subcategory?: string
  criteria: string[]
}

export type ReportReview = {
  id: string
  title: string
  summary?: string
  details?: string
  reporter?: string
  source?: string
  externalID?: string
  approved?: boolean
  reportedAt?: string
  reviewedAt?: string
  approvedAt?: string
  refCodes: string[]
}

export type ReportFinding = {
  id: string
  description: string
  severity?: string
  open?: boolean
  source?: string
  reportedAt?: string
  refCodes: string[]
}

export type ReportProgram = {
  name?: string
  description?: string
  auditFirm?: string
  auditor?: string
  auditorEmail?: string
}

export type ParsedReport = {
  platforms: ReportPlatform[]
  systems: ReportSystem[]
  vendors: ReportVendor[]
  assets: ReportAsset[]
  groups: ReportGroup[]
  controls: ReportControl[]
  reviews: ReportReview[]
  findings: ReportFinding[]
  program?: ReportProgram
  reportedCategories: string[]
}

export type ReportSectionItems = Pick<ParsedReport, ReportSectionId>

export type ReportSelection = Record<ReportSectionId, Set<string>>

export type ReportProgramChoice = {
  create: boolean
  categories: Set<string>
}

export type ReportPlatformOverrides = Record<string, Partial<ReportPlatformFields>>

export type ReportSystemOverrides = Record<string, Partial<ReportSystemFields>>
