'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ControlControlStatus } from '@repo/codegen/src/schema'
import { type ControlReportItem } from '@/lib/graphql-hooks/control'
import { useDismissible } from '@/hooks/useDismissible'
import { Callout } from '@/components/shared/callout/callout'
import { DismissButton } from '@/components/shared/docs-help/suggestion-card'
import { hasOrgCoverageGap, hasPolicyGap } from './report-coverage'
import { ResolveGapsPanel, useSectionGapGroups, type TGapControl } from './resolve-gaps-panel'

type ReportCategoryHeaderProps = {
  category: string
  controls: ControlReportItem[]
  isOpen: boolean
  expandedControls: Record<string, boolean>
  accentColor: string
  onToggleOpen: () => void
  onToggleCategorySubcontrols: () => void
}

const toGapControl = (control: ControlReportItem): TGapControl => ({ id: control.id, refCode: control.refCode, referenceFramework: control.referenceFramework ?? '', description: control.description })

const ReportCategoryHeader: React.FC<ReportCategoryHeaderProps> = ({ category, controls, isOpen, expandedControls, accentColor, onToggleOpen, onToggleCategorySubcontrols }) => {
  const [showResolveGaps, setShowResolveGaps] = useState(false)
  const orgGapControls = useMemo(() => controls.filter(hasOrgCoverageGap).map(toGapControl), [controls])
  const policyGapControls = useMemo(() => controls.filter(hasPolicyGap).map(toGapControl), [controls])
  const hasCheapGap = orgGapControls.length + policyGapControls.length > 0

  const { dismissed: confirmedEmpty, dismiss: markEmpty, isResolved: isEmptyCheckResolved } = useDismissible(`resolve-gaps-empty:${category || 'General'}`)
  const shouldCheck = hasCheapGap && isEmptyCheckResolved && !confirmedEmpty

  const gaps = useSectionGapGroups(shouldCheck ? orgGapControls : undefined, shouldCheck ? policyGapControls : undefined)

  useEffect(() => {
    if (shouldCheck && !gaps.isLoading && !gaps.hasError && gaps.totalCount === 0) markEmpty()
  }, [shouldCheck, gaps.isLoading, gaps.totalCount, markEmpty])

  const { dismissed: bannerDismissed, dismiss: dismissBanner } = useDismissible(`resolve-gaps-banner-dismissed:${category || 'General'}`)
  const showButton = shouldCheck && gaps.totalCount > 0 && !bannerDismissed

  const hasSubs = controls.some((c) => (c.subcontrols?.length ?? 0) > 0)
  const allSubsExpanded = controls.filter((c) => (c.subcontrols?.length ?? 0) > 0).every((c) => expandedControls[c.id])
  const approvedCount = controls.filter((c) => c.status === ControlControlStatus.APPROVED).length
  const approvalPct = controls.length > 0 ? (approvedCount / controls.length) * 100 : 0
  const barClass = approvalPct === 100 ? 'coverage-bar-complete' : approvalPct > 0 ? 'coverage-bar-partial' : 'coverage-bar-empty'

  return (
    <div className={`border border-border border-l-4 ${isOpen ? 'rounded-t-md border-b-0' : 'rounded-md'}`} style={{ borderLeftColor: accentColor }}>
      {gaps.workers}
      <div className="px-4 py-3 space-y-3">
        <div className="flex justify-between items-center">
          <button type="button" className="size-fit group flex items-center gap-2 min-w-0" onClick={onToggleOpen}>
            <ChevronDown size={22} className={`text-brand transition-transform shrink-0 ${isOpen ? '' : '-rotate-90'}`} />
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
        {showButton && (
          <Callout variant="recommendation" compact contentClassName="flex items-center gap-3">
            <span className="flex-1 font-medium">{gaps.totalCount} recommended mappings are ready for review</span>
            <Button type="button" variant="link" className="shrink-0 gap-1 text-[var(--color-recommendation)]" icon={<ArrowRight size={14} />} onClick={() => setShowResolveGaps(true)}>
              Review recommendations
            </Button>
            <DismissButton onClick={dismissBanner} label="Dismiss resolve gaps banner" tooltip="Dismiss" />
          </Callout>
        )}
      </div>
      {(shouldCheck || showResolveGaps) && <ResolveGapsPanel open={showResolveGaps} onOpenChange={setShowResolveGaps} category={category} gaps={gaps} />}
    </div>
  )
}

export default ReportCategoryHeader
