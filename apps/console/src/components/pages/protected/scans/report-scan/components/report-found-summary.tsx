'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { Card } from '@repo/ui/cardpanel'
import { Separator } from '@repo/ui/separator'
import { REPORT_SECTION_META, visibleReportSections } from '../sections'
import type { ParsedReport, ReportStepId } from '../types'

type ReportFoundSummaryProps = {
  report: ParsedReport
  visibility: Record<ReportStepId, boolean>
}

export const ReportFoundSummary = ({ report, visibility }: ReportFoundSummaryProps) => (
  <Card className="mt-6">
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">What we found</p>
      <p className="text-sm text-muted-foreground">Nothing has been created yet</p>
    </div>
    {visibleReportSections(visibility).map((stepId, index) => {
      const { icon: Icon, label, summary } = REPORT_SECTION_META[stepId]

      return (
        <React.Fragment key={stepId}>
          <Separator separatorClass="bg-border" />
          <div className="flex items-center gap-4 px-6 py-3">
            <span className="w-6 shrink-0 font-mono text-sm text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
            <Icon size={18} className="shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{label}</p>
              <p className="text-sm text-muted-foreground">{summary}</p>
            </div>
            {stepId === 'program' ? <span className="text-sm text-muted-foreground">optional</span> : <Badge variant="secondary">{report[stepId].length}</Badge>}
          </div>
        </React.Fragment>
      )
    })}
  </Card>
)
