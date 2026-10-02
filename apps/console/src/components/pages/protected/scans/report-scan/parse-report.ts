import { isRecord } from '@/utils/type-guards'
import { SOC_2_REQUIRED_CATEGORY, sortTrustServicesCategories, trustServicesCategoryForCriteria, trustServicesCategoryForName } from '@/constants/trust-services-categories'
import { canonicalizeLookupValue, companyNameKeys, sanitizeEntityName } from '../shared/name-utils'
import type { ParsedReport, ReportAsset, ReportControl, ReportFinding, ReportGroup, ReportPlatform, ReportProgram, ReportReview, ReportSystem, ReportVendor } from './types'

type RawItem = Record<string, unknown>

const text = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() ? value.trim() : undefined)

const flag = (value: unknown): boolean | undefined => (typeof value === 'boolean' ? value : undefined)

const textList = (value: unknown): string[] => (Array.isArray(value) ? [...new Set(value.map(text).filter((item): item is string => !!item))] : [])

const sectionItems = (report: Record<string, unknown>, section: string): RawItem[] => {
  const raw = report[section]
  const items = isRecord(raw) ? raw[section] : raw
  return Array.isArray(items) ? items.filter(isRecord) : []
}

const withIds = <T>(section: string, items: RawItem[], parse: (item: RawItem, id: string) => T | undefined): T[] =>
  items.flatMap((item, index) => {
    const parsed = parse(item, `${section}-${index}`)
    return parsed ? [parsed] : []
  })

const uniqueBy = <T>(items: T[], key: (item: T) => string): T[] => {
  const seen = new Set<string>()
  return items.filter((item) => {
    const value = key(item)
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

const byName = (item: { name: string }) => canonicalizeLookupValue(item.name)

const validatedName = (item: RawItem) => {
  const raw = text(item.name) ?? text(item.displayName)
  if (!raw) return undefined
  const name = sanitizeEntityName(raw)
  return { name, displayName: text(item.displayName) ?? (name === raw ? undefined : raw) }
}

type RawSystem = ReportSystem & { platformName?: string }

type RawFinding = ReportFinding & { reviewExternalID?: string }

const parsePlatform = (item: RawItem, id: string): ReportPlatform | undefined => {
  const name = text(item.name)
  if (!name) return undefined
  return {
    id,
    name,
    description: text(item.description) ?? '',
    businessPurpose: text(item.businessPurpose) ?? '',
    environmentName: text(item.environmentName) ?? '',
    scopeName: text(item.scopeName) ?? '',
    region: text(item.region) ?? '',
    physicalLocation: text(item.physicalLocation) ?? '',
    containsPii: flag(item.containsPII) ?? false,
  }
}

const parseSystem = (item: RawItem, id: string): RawSystem | undefined => {
  const name = text(item.name)
  if (!name) return undefined
  return { id, name, description: text(item.description) ?? '', platformName: text(item.platformName) }
}

const linkSystemsToPlatforms = (systems: RawSystem[], platforms: ReportPlatform[]): ReportSystem[] =>
  systems.map(({ platformName, ...system }) => ({
    ...system,
    platformId: platforms.find((platform) => byName(platform) === canonicalizeLookupValue(platformName))?.id ?? platforms[0]?.id,
  }))

const linkAssetsToVendors = (assets: ReportAsset[], vendors: ReportVendor[]): ReportAsset[] => {
  const vendorKeys = vendors.map((vendor) => ({ id: vendor.id, keys: companyNameKeys(vendor.name, vendor.displayName) }))
  return assets.map((asset) => {
    const assetKeys = companyNameKeys(asset.vendorName)
    return { ...asset, vendorId: vendorKeys.find(({ keys }) => keys.some((key) => assetKeys.includes(key)))?.id }
  })
}

const linkFindingsToReviews = (findings: RawFinding[], reviews: ReportReview[]): ReportFinding[] => {
  const reviewIdByExternalId = new Map(reviews.flatMap((review) => (review.externalID ? [[review.externalID, review.id] as const] : [])))
  return findings.map(({ reviewExternalID, ...finding }) => ({ ...finding, reviewId: reviewExternalID ? reviewIdByExternalId.get(reviewExternalID) : undefined }))
}

const parseVendor = (item: RawItem, id: string): ReportVendor | undefined => {
  const names = validatedName(item)
  if (!names) return undefined
  return {
    id,
    ...names,
    description: text(item.description),
    domains: textList(item.domains),
    providedServices: textList(item.providedServices),
    hasSoc2: flag(item.hasSOC2),
    ssoEnforced: flag(item.ssoEnforced),
    mfaSupported: flag(item.mfaSupport),
    mfaEnforced: flag(item.mfaEnforced),
    statusPageURL: text(item.statusPageURL),
  }
}

const parseAsset = (item: RawItem, id: string): ReportAsset | undefined => {
  const name = text(item.name) ?? text(item.displayName)
  if (!name) return undefined
  return {
    id,
    name,
    displayName: text(item.displayName),
    description: text(item.description),
    assetType: text(item.assetType),
    containsPii: flag(item.hasPII),
    physicalLocation: text(item.physicalLocation),
    region: text(item.region),
    categories: textList(item.categories),
    vendorName: text(item.entityName),
  }
}

const parseGroup = (item: RawItem, id: string): ReportGroup | undefined => {
  const names = validatedName(item)
  return names ? { id, ...names, description: text(item.description) } : undefined
}

const parseControl = (item: RawItem, id: string): ReportControl | undefined => {
  const refCode = text(item.refCode)
  if (!refCode) return undefined
  return {
    id,
    refCode,
    title: text(item.title),
    description: text(item.description),
    auditorReferenceID: text(item.auditorReferenceID),
    category: text(item.category),
    subcategory: text(item.subcategory),
    criteria: textList(item.soc2Mapping),
  }
}

const parseReview = (item: RawItem, id: string): ReportReview | undefined => {
  const title = text(item.title)
  if (!title) return undefined
  return {
    id,
    title,
    summary: text(item.summary),
    details: text(item.details),
    reporter: text(item.reporter),
    source: text(item.source),
    externalID: text(item.externalID),
    approved: flag(item.approved),
    reportedAt: text(item.reportedAt),
    reviewedAt: text(item.reviewedAt),
    approvedAt: text(item.approvedAt),
    refCodes: textList(item.refCodes),
  }
}

const parseFinding = (item: RawItem, id: string): RawFinding | undefined => {
  const description = text(item.description)
  if (!description) return undefined
  return {
    id,
    description,
    severity: text(item.severity),
    open: flag(item.open),
    source: text(item.source),
    reportedAt: text(item.reported_at),
    refCodes: textList(item.refCodes),
    reviewExternalID: text(item.reviewExternalID),
  }
}

const parseProgram = (item?: RawItem): ReportProgram | undefined =>
  item
    ? {
        name: text(item.name),
        description: text(item.description),
        auditFirm: text(item.auditFirm),
        auditor: text(item.auditor),
        auditorEmail: text(item.auditorEmail),
      }
    : undefined

const reportedCategoriesOf = (controls: ReportControl[], domains: RawItem[]): string[] => {
  const fromCriteria = controls.flatMap((control) => control.criteria.map(trustServicesCategoryForCriteria))
  const fromDomains = domains.map((domain) => trustServicesCategoryForName(text(domain.name) ?? ''))
  const categories = new Set([SOC_2_REQUIRED_CATEGORY, ...[...fromCriteria, ...fromDomains].filter((category): category is string => !!category)])
  return sortTrustServicesCategories([...categories])
}

const reportSectionsOf = (metadata: unknown): Record<string, unknown> | undefined => {
  const report = isRecord(metadata) ? metadata.report : undefined
  return isRecord(report) ? report : undefined
}

export const parseReport = (metadata: unknown): ParsedReport | undefined => {
  const report = reportSectionsOf(metadata)
  if (!report) return undefined

  const controls = uniqueBy(withIds<ReportControl>('controls', sectionItems(report, 'controls'), parseControl), (control) => control.refCode)
  const platforms = uniqueBy(withIds<ReportPlatform>('platforms', sectionItems(report, 'platforms'), parsePlatform), byName)
  const reviews = withIds<ReportReview>('reviews', sectionItems(report, 'reviews'), parseReview)
  const vendors = uniqueBy(withIds<ReportVendor>('vendors', sectionItems(report, 'entities'), parseVendor), byName)

  return {
    platforms,
    systems: linkSystemsToPlatforms(withIds<RawSystem>('systems', sectionItems(report, 'systemdetails'), parseSystem), platforms),
    vendors,
    assets: linkAssetsToVendors(uniqueBy(withIds<ReportAsset>('assets', sectionItems(report, 'assets'), parseAsset), byName), vendors),
    groups: uniqueBy(withIds<ReportGroup>('groups', sectionItems(report, 'groups'), parseGroup), byName),
    controls,
    reviews,
    findings: linkFindingsToReviews(withIds<RawFinding>('findings', sectionItems(report, 'findings'), parseFinding), reviews),
    program: parseProgram(sectionItems(report, 'programs')[0]),
    reportedCategories: reportedCategoriesOf(controls, sectionItems(report, 'domains')),
  }
}

export const reportScanErrorOf = (metadata: unknown): string | undefined => (isRecord(metadata) ? text(metadata.error) : undefined)
