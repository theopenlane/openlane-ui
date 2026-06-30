'use client'

import React from 'react'
import { ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ControlControlStatus } from '@repo/codegen/src/schema'
import { type ControlReportItem } from '@/lib/graphql-hooks/control'

type ReportCategoryHeaderProps = {
  category: string
  controls: ControlReportItem[]
  isOpen: boolean
  expandedControls: Record<string, boolean>
  accentColor: string
  onToggleOpen: () => void
  onToggleCategorySubcontrols: () => void
}

const ReportCategoryHeader: React.FC<ReportCategoryHeaderProps> = ({ category, controls, isOpen, expandedControls, accentColor, onToggleOpen, onToggleCategorySubcontrols }) => {
  const hasSubs = controls.some((c) => (c.subcontrols?.length ?? 0) > 0)
  const allSubsExpanded = controls.filter((c) => (c.subcontrols?.length ?? 0) > 0).every((c) => expandedControls[c.id])
  const approvedCount = controls.filter((c) => c.status === ControlControlStatus.APPROVED).length
  const approvalPct = controls.length > 0 ? (approvedCount / controls.length) * 100 : 0
  const barClass = approvalPct === 100 ? 'coverage-bar-complete' : approvalPct > 0 ? 'coverage-bar-partial' : 'coverage-bar-empty'

  return (
    <div className={`flex justify-between items-center px-4 py-3 border border-border border-l-4 ${isOpen ? 'rounded-t-md border-b-0' : 'rounded-md'}`} style={{ borderLeftColor: accentColor }}>
      <button type="button" className="size-fit group flex items-center gap-2" onClick={onToggleOpen}>
        <ChevronDown size={22} className={`text-brand transition-transform ${isOpen ? '' : '-rotate-90'}`} />
        <span className="text-xl">{category || 'General'}</span>
      </button>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-sm text-muted-foreground whitespace-nowrap min-w-[88px] text-right">
            <span className="font-medium text-foreground">{approvedCount}</span>/{controls.length} approved
          </span>
          <div className="w-24 h-1.5 rounded-full bg-border overflow-hidden shrink-0">
            <div className={`h-full rounded-full transition-all ${barClass}`} style={{ width: `${approvalPct}%` }} />
          </div>
        </div>
        {hasSubs && isOpen && (
          <Button
            type="button"
            variant="outline"
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={(e) => {
              e.stopPropagation()
              onToggleCategorySubcontrols()
            }}
          >
            <ChevronsUpDown size={12} />
            {allSubsExpanded ? 'Collapse subcontrols' : 'Expand subcontrols'}
          </Button>
        )}
      </div>
    </div>
  )
}

export default ReportCategoryHeader
