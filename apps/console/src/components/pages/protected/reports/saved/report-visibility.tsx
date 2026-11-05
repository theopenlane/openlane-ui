'use client'

import React from 'react'
import { Building2, Lock, type LucideIcon, Users } from 'lucide-react'
import { ReportReportVisibility } from '@repo/codegen/src/schema'
import { Badge } from '@repo/ui/badge'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { reportVisibilityOf } from '@/lib/report/saved-report'

type TVisibilityMeta = {
  optionLabel: string
  description: string
  icon: LucideIcon
}

export const REPORT_VISIBILITY_META: Record<ReportReportVisibility, TVisibilityMeta> = {
  [ReportReportVisibility.PRIVATE]: { optionLabel: 'Only me', description: 'Only you can view and edit this report.', icon: Lock },
  [ReportReportVisibility.RESTRICTED]: { optionLabel: 'Specific people', description: 'Only the users and groups you select can view and run this report.', icon: Users },
  [ReportReportVisibility.ORGANIZATION]: {
    optionLabel: 'Everyone in your organization',
    description: 'All users in your organization can view and run this report.',
    icon: Building2,
  },
}

export const REPORT_VISIBILITY_OPTIONS = [ReportReportVisibility.PRIVATE, ReportReportVisibility.RESTRICTED, ReportReportVisibility.ORGANIZATION]

const visibilityMeta = (visibility: ReportReportVisibility | null | undefined): TVisibilityMeta => REPORT_VISIBILITY_META[reportVisibilityOf(visibility)] ?? REPORT_VISIBILITY_META.PRIVATE

export const ReportVisibilityLabel: React.FC<{ visibility?: ReportReportVisibility | null }> = ({ visibility }) => {
  const { icon: Icon } = visibilityMeta(visibility)

  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size={14} className="shrink-0 text-muted-foreground" />
      {getEnumLabel(reportVisibilityOf(visibility))}
    </span>
  )
}

export const ReportVisibilityBadge: React.FC<{ visibility?: ReportReportVisibility | null }> = ({ visibility }) => {
  const { icon: Icon } = visibilityMeta(visibility)

  return (
    <Badge variant="outline" className="gap-1 shrink-0">
      <Icon size={12} />
      {getEnumLabel(reportVisibilityOf(visibility))}
    </Badge>
  )
}
