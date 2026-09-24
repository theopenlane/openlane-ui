import {
  type ParsedReport,
  type ReportPlatform,
  type ReportPlatformOverrides,
  type ReportSectionId,
  type ReportSectionItems,
  type ReportSelection,
  type ReportSystem,
  type ReportSystemOverrides,
} from './types'

export const sectionItemIds = (report: ParsedReport, section: ReportSectionId): string[] => report[section].map((item) => item.id)

export const buildSelection = (build: (section: ReportSectionId) => Iterable<string>): ReportSelection => ({
  platforms: new Set(build('platforms')),
  systems: new Set(build('systems')),
  vendors: new Set(build('vendors')),
  assets: new Set(build('assets')),
  groups: new Set(build('groups')),
  controls: new Set(build('controls')),
  reviews: new Set(build('reviews')),
  findings: new Set(build('findings')),
})

export const selectAll = (report: ParsedReport): ReportSelection => buildSelection((section) => sectionItemIds(report, section))

export const selectedItems = (report: ParsedReport, selection: ReportSelection): ReportSectionItems => ({
  platforms: report.platforms.filter((item) => selection.platforms.has(item.id)),
  systems: report.systems.filter((item) => selection.systems.has(item.id)),
  vendors: report.vendors.filter((item) => selection.vendors.has(item.id)),
  assets: report.assets.filter((item) => selection.assets.has(item.id)),
  groups: report.groups.filter((item) => selection.groups.has(item.id)),
  controls: report.controls.filter((item) => selection.controls.has(item.id)),
  reviews: report.reviews.filter((item) => selection.reviews.has(item.id)),
  findings: report.findings.filter((item) => selection.findings.has(item.id)),
})

export const resolvePlatform = (platform: ReportPlatform, overrides: ReportPlatformOverrides): ReportPlatform => ({ ...platform, ...overrides[platform.id] })

export const resolveSystem = (system: ReportSystem, overrides: ReportSystemOverrides): ReportSystem => ({ ...system, ...overrides[system.id] })
