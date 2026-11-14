import type { ScanSummaryItem, ScanSummarySection } from '../shared/types'
import { REPORT_SECTION_META, visibleReportSections, type ReportContentStepId } from './sections'
import { resolvePlatform, resolveSystem, selectedItems } from './selection'
import type { ParsedReport, ReportPlatformOverrides, ReportProgramChoice, ReportSelection, ReportStepId, ReportSystemOverrides } from './types'

type SummarySectionsArgs = {
  report: ParsedReport
  selection: ReportSelection
  visibility: Record<ReportStepId, boolean>
  platformOverrides: ReportPlatformOverrides
  systemOverrides: ReportSystemOverrides
  program: ReportProgramChoice
  programName: string
}

const SUMMARY_TITLES: Partial<Record<ReportContentStepId, string>> = { program: 'Program' }

export const buildSummarySections = ({ report, selection, visibility, platformOverrides, systemOverrides, program, programName }: SummarySectionsArgs): ScanSummarySection<ReportStepId>[] => {
  const selected = selectedItems(report, selection)
  const items: Record<ReportContentStepId, ScanSummaryItem[]> = {
    platforms: selected.platforms.map((platform) => resolvePlatform(platform, platformOverrides)).map(({ id, name, description }) => ({ id, name, description })),
    systems: selected.systems.map((system) => resolveSystem(system, systemOverrides)).map(({ id, name, description }) => ({ id, name, description })),
    vendors: selected.vendors.map(({ id, name, description }) => ({ id, name, description })),
    assets: selected.assets.map(({ id, name, description }) => ({ id, name, description })),
    groups: selected.groups.map(({ id, name, description }) => ({ id, name, description })),
    controls: selected.controls.map(({ id, refCode, title }) => ({ id, name: title ? `${refCode} · ${title}` : refCode })),
    reviews: selected.reviews.map(({ id, title, refCodes }) => ({ id, name: title, description: refCodes.join(', ') || undefined })),
    findings: selected.findings.map(({ id, description, severity }) => ({ id, name: description, description: severity })),
    program: program.create ? [{ id: 'program', name: report.program?.name ?? programName, description: [...program.categories].join(', ') }] : [],
  }

  return visibleReportSections(visibility).map((stepId) => ({ stepId, title: SUMMARY_TITLES[stepId] ?? REPORT_SECTION_META[stepId].label, items: items[stepId] }))
}
