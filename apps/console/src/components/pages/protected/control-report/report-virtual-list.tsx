'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ControlControlStatus } from '@repo/codegen/src/schema'
import { type ControlReportItem, type ControlReportSubcontrolItem } from '@/lib/graphql-hooks/control'
import ControlRow from './control-row'
import ControlTableHeader from './control-table-header'
import { SubcontrolRow, SubcontrolGroupHeader } from './subcontrol-rows'
import ReportCategoryHeader from './report-category-header'
import { getGridMinWidth } from './control-report-grid'

type ReportCategoryData = {
  category: string
  controls: ControlReportItem[]
}

type FlatRow =
  | { kind: 'category'; key: string; category: string; controls: ControlReportItem[]; accent: string }
  | { kind: 'columns'; key: string; controlIds: string[]; accent: string; lastInCategory: boolean }
  | { kind: 'control'; key: string; control: ControlReportItem; accent: string; lastInCategory: boolean }
  | { kind: 'subheader'; key: string; control: ControlReportItem; accent: string; lastInCategory: boolean }
  | { kind: 'subcontrol'; key: string; sub: ControlReportSubcontrolItem; control: ControlReportItem; accent: string; lastInCategory: boolean }

type ReportVirtualListProps = {
  categories: ReportCategoryData[]
  expandedItems: string[]
  expandedControls: Record<string, boolean>
  isCustomView: boolean
  isSelectionMode: boolean
  selectedControlIds: Set<string>
  selectedSubcontrolIds: Set<string>
  onToggleCategoryOpen: (category: string) => void
  onToggleControl: (id: string) => void
  onToggleCategorySubcontrols: (category: string, controls: ControlReportItem[]) => void
  onSelectControl: (id: string, checked: boolean) => void
  onSelectAllControls: (ids: string[]) => void
  onSelectSubcontrol: (id: string, checked: boolean) => void
  onSelectAllSubcontrols: (ids: string[], checked: boolean) => void
}

const accentFor = (controls: ControlReportItem[]): string => {
  const approved = controls.filter((c) => c.status === ControlControlStatus.APPROVED).length
  const pct = controls.length > 0 ? (approved / controls.length) * 100 : 0
  return pct === 100 ? '#22c55e' : pct > 0 ? '#fbbf24' : 'var(--color-border)'
}

const ReportVirtualList: React.FC<ReportVirtualListProps> = ({
  categories,
  expandedItems,
  expandedControls,
  isCustomView,
  isSelectionMode,
  selectedControlIds,
  selectedSubcontrolIds,
  onToggleCategoryOpen,
  onToggleControl,
  onToggleCategorySubcontrols,
  onSelectControl,
  onSelectAllControls,
  onSelectSubcontrol,
  onSelectAllSubcontrols,
}) => {
  const listRef = useRef<HTMLDivElement>(null)
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null)
  const [scrollMargin, setScrollMargin] = useState(0)

  useEffect(() => {
    setScrollEl(document.querySelector<HTMLElement>('[data-scroll-container="main"]'))
  }, [])

  useEffect(() => {
    if (listRef.current) setScrollMargin(listRef.current.offsetTop)
  }, [scrollEl])

  const flatRows = useMemo<FlatRow[]>(() => {
    const rows: FlatRow[] = []
    for (const { category, controls } of categories) {
      if (controls.length === 0) continue
      const accent = accentFor(controls)
      rows.push({ kind: 'category', key: `cat:${category}`, category, controls, accent })
      if (!expandedItems.includes(category)) continue

      const firstContentIndex = rows.length
      rows.push({ kind: 'columns', key: `cols:${category}`, controlIds: controls.map((c) => c.id), accent, lastInCategory: false })
      for (const control of controls) {
        rows.push({ kind: 'control', key: `ctrl:${control.id}`, control, accent, lastInCategory: false })
        if (expandedControls[control.id] && (control.subcontrols?.length ?? 0) > 0) {
          rows.push({ kind: 'subheader', key: `subh:${control.id}`, control, accent, lastInCategory: false })
          for (const sub of control.subcontrols ?? []) {
            rows.push({ kind: 'subcontrol', key: `sub:${control.id}:${sub.id}`, sub, control, accent, lastInCategory: false })
          }
        }
      }

      if (rows.length > firstContentIndex) {
        const last = rows[rows.length - 1]
        if (last.kind !== 'category') last.lastInCategory = true
      }
    }
    return rows
  }, [categories, expandedItems, expandedControls])

  const virtualizer = useVirtualizer({
    count: flatRows.length,
    getScrollElement: () => scrollEl,
    estimateSize: () => 88,
    overscan: 5,
    getItemKey: (index) => flatRows[index].key,
    scrollMargin,
  })

  const minWidth = getGridMinWidth(isCustomView, isSelectionMode)

  const contentWrapperClass = (lastInCategory: boolean, extra = ''): string =>
    `border-x border-border border-l-4 ${extra} ${lastInCategory ? 'border-b border-border rounded-b-md overflow-hidden' : ''}`.trim()

  const renderRow = (row: FlatRow): React.ReactNode => {
    switch (row.kind) {
      case 'category':
        return (
          <div className="pt-3">
            <ReportCategoryHeader
              category={row.category}
              controls={row.controls}
              isOpen={expandedItems.includes(row.category)}
              expandedControls={expandedControls}
              accentColor={row.accent}
              onToggleOpen={() => onToggleCategoryOpen(row.category)}
              onToggleCategorySubcontrols={() => onToggleCategorySubcontrols(row.category, row.controls)}
            />
          </div>
        )
      case 'columns':
        return (
          <div className={contentWrapperClass(row.lastInCategory)} style={{ borderLeftColor: row.accent }}>
            <ControlTableHeader isCustomView={isCustomView} isSelectionMode={isSelectionMode} allIds={row.controlIds} selectedIds={selectedControlIds} onSelectAll={onSelectAllControls} />
          </div>
        )
      case 'control':
        return (
          <div className={contentWrapperClass(row.lastInCategory)} style={{ borderLeftColor: row.accent }}>
            <ControlRow
              control={row.control}
              expanded={!!expandedControls[row.control.id]}
              onToggle={onToggleControl}
              isCustomView={isCustomView}
              isSelectionMode={isSelectionMode}
              selected={selectedControlIds.has(row.control.id)}
              onSelect={onSelectControl}
            />
          </div>
        )
      case 'subheader':
        return (
          <div className={contentWrapperClass(row.lastInCategory, 'bg-background-secondary')} style={{ borderLeftColor: row.accent }}>
            <SubcontrolGroupHeader
              subIds={(row.control.subcontrols ?? []).map((s) => s.id)}
              isSelectionMode={isSelectionMode}
              selectedSubcontrolIds={selectedSubcontrolIds}
              onSelectAllSubcontrols={onSelectAllSubcontrols}
            />
          </div>
        )
      case 'subcontrol':
        return (
          <div className={contentWrapperClass(row.lastInCategory, 'bg-background-secondary')} style={{ borderLeftColor: row.accent }}>
            <SubcontrolRow
              sub={row.sub}
              controlId={row.control.id}
              controlOwner={row.control.controlOwner}
              isCustomView={isCustomView}
              isSelectionMode={isSelectionMode}
              selected={selectedSubcontrolIds.has(row.sub.id)}
              onSelect={onSelectSubcontrol}
            />
          </div>
        )
    }
  }

  return (
    <div ref={listRef} style={{ minWidth: `${minWidth}px` }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)` }}
          >
            {renderRow(flatRows[virtualRow.index])}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ReportVirtualList
