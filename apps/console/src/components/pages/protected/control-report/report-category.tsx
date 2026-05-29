'use client'

import React from 'react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown, ChevronsUpDown } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { ControlControlStatus } from '@repo/codegen/src/schema'
import { type ControlGroupItem } from '@/lib/graphql-hooks/control'
import { type FrameworkCoverageData } from '@/lib/graphql-hooks/mapped-control'
import { type OrgCoverageData } from './org-coverage-cell'
import ControlTableHeader from './control-table-header'
import ControlRow from './control-row'
import SubcontrolRows from './subcontrol-rows'

type ReportCategoryProps = {
  category: string
  controls: ControlGroupItem[]
  isOpen: boolean
  isCustomView: boolean
  isSelectionMode: boolean
  expandedControls: Record<string, boolean>
  onToggleControl: (id: string) => void
  onToggleCategorySubcontrols: (category: string, controls: ControlGroupItem[]) => void
  selectedControlIds: Set<string>
  selectedSubcontrolIds: Set<string>
  onSelectControl: (id: string, checked: boolean) => void
  onSelectAllControls: (ids: string[]) => void
  onSelectSubcontrol: (id: string, checked: boolean) => void
  onSelectAllSubcontrols: (ids: string[], checked: boolean) => void
  orgCoverageMap: Map<string, OrgCoverageData>
  frameworkCoverageMap: Map<string, FrameworkCoverageData>
}

const ReportCategory: React.FC<ReportCategoryProps> = ({
  category,
  controls,
  isOpen,
  isCustomView,
  isSelectionMode,
  expandedControls,
  onToggleControl,
  onToggleCategorySubcontrols,
  selectedControlIds,
  selectedSubcontrolIds,
  onSelectControl,
  onSelectAllControls,
  onSelectSubcontrol,
  onSelectAllSubcontrols,
  orgCoverageMap,
  frameworkCoverageMap,
}) => {
  const hasSubs = controls.some((c) => c.subcontrolCount > 0)
  const allSubsExpanded = controls.filter((c) => c.subcontrolCount > 0).every((c) => expandedControls[c.id])
  const approvedCount = controls.filter((c) => c.status === ControlControlStatus.APPROVED).length
  const approvalPct = controls.length > 0 ? (approvedCount / controls.length) * 100 : 0
  const accentColor = approvalPct === 100 ? '#22c55e' : approvalPct > 0 ? '#fbbf24' : 'var(--color-border)'
  const barClass = approvalPct === 100 ? 'coverage-bar-complete' : approvalPct > 0 ? 'coverage-bar-partial' : 'coverage-bar-empty'

  return (
    <AccordionItem className="mt-3 border border-border rounded-md overflow-hidden border-l-4" style={{ borderLeftColor: accentColor }} value={category}>
      <div className="flex justify-between items-center px-4 py-3">
        <AccordionTrigger asChild className="bg-unset">
          <button className="size-fit group flex items-center gap-2">
            <ChevronDown size={22} className="text-brand transform -rotate-90 transition-transform group-data-[state=open]:rotate-0" />
            <span className="text-xl">{category || 'General'}</span>
          </button>
        </AccordionTrigger>
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
                onToggleCategorySubcontrols(category, controls)
              }}
            >
              <ChevronsUpDown size={12} />
              {allSubsExpanded ? 'Collapse subcontrols' : 'Expand subcontrols'}
            </Button>
          )}
        </div>
      </div>
      <AccordionContent>
        <div className="border-t border-border overflow-hidden">
          <ControlTableHeader isCustomView={isCustomView} isSelectionMode={isSelectionMode} allIds={controls.map((c) => c.id)} selectedIds={selectedControlIds} onSelectAll={onSelectAllControls} />
          {controls.map((control) => (
            <React.Fragment key={control.id}>
              <ControlRow
                control={control}
                expanded={!!expandedControls[control.id]}
                onToggle={() => onToggleControl(control.id)}
                isCustomView={isCustomView}
                isSelectionMode={isSelectionMode}
                coverageData={orgCoverageMap.get(control.id)}
                frameworkData={frameworkCoverageMap.get(control.id)}
                selected={selectedControlIds.has(control.id)}
                onSelect={onSelectControl}
              />
              {expandedControls[control.id] && (
                <SubcontrolRows
                  controlId={control.id}
                  isCustomView={isCustomView}
                  isSelectionMode={isSelectionMode}
                  selectedSubcontrolIds={selectedSubcontrolIds}
                  onSelectSubcontrol={onSelectSubcontrol}
                  onSelectAllSubcontrols={onSelectAllSubcontrols}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export default ReportCategory
