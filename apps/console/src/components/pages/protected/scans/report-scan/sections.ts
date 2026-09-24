import { LayoutGridIcon, MonitorCogIcon, type LucideIcon } from 'lucide-react'
import { ObjectAssociationMap } from '@/components/shared/enum-mapper/object-association-enum'
import { REPORT_SCAN_STEPS, type ParsedReport, type ReportStepId } from './types'

type ReportSectionMeta = {
  label: string
  summary: string
  icon: LucideIcon
}

export type ReportContentStepId = Exclude<ReportStepId, 'confirm'>

const stepLabel = (stepId: ReportContentStepId) => REPORT_SCAN_STEPS.find((step) => step.id === stepId)?.label ?? stepId

export const REPORT_SECTION_META: Record<ReportContentStepId, ReportSectionMeta> = {
  platforms: { label: stepLabel('platforms'), summary: 'Your top-level product or service offering', icon: LayoutGridIcon },
  systems: { label: stepLabel('systems'), summary: 'The systems your report describes inside that platform', icon: MonitorCogIcon },
  vendors: { label: stepLabel('vendors'), summary: 'Subservice organizations named in the report', icon: ObjectAssociationMap.entities.icon },
  assets: { label: stepLabel('assets'), summary: 'Systems and infrastructure described as in scope', icon: ObjectAssociationMap.assets.icon },
  groups: { label: stepLabel('groups'), summary: 'The roles responsible for parts of the program', icon: ObjectAssociationMap.groups.icon },
  controls: { label: stepLabel('controls'), summary: 'What you operate, and the criteria each one satisfies', icon: ObjectAssociationMap.controls.icon },
  reviews: { label: stepLabel('reviews'), summary: 'The procedures the auditor performed against each control', icon: ObjectAssociationMap.reviews.icon },
  findings: { label: stepLabel('findings'), summary: 'Exceptions the auditor noted, against their control', icon: ObjectAssociationMap.findings.icon },
  program: { label: 'Create a program', summary: 'Group these controls into a SOC 2 program', icon: ObjectAssociationMap.programs.icon },
}

export const reportStepVisibility = (report: ParsedReport): Record<ReportStepId, boolean> => ({
  platforms: report.platforms.length > 0,
  systems: report.systems.length > 0,
  vendors: report.vendors.length > 0,
  assets: report.assets.length > 0,
  groups: report.groups.length > 0,
  controls: report.controls.length > 0,
  reviews: report.reviews.length > 0,
  findings: report.findings.length > 0,
  program: report.controls.length > 0,
  confirm: true,
})

export const visibleReportSections = (visibility: Record<ReportStepId, boolean>): ReportContentStepId[] =>
  REPORT_SCAN_STEPS.map((step) => step.id).filter((stepId): stepId is ReportContentStepId => stepId !== 'confirm' && visibility[stepId])
