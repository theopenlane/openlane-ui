'use client'

import React, { memo, useMemo, useState } from 'react'
import { Input } from '@repo/ui/input'
import type { TReportEntity } from '@repo/codegen/src/report-schema.generated'
import { labelledFields } from '@/lib/report/report-schema'
import ReportPanel from './report-panel'
import ReportSelectAll from './report-select-all'
import ReportFieldList from './report-field-list'
import { matchesSearch } from './report-search'

type TReportColumnsPanelProps = {
  entity: TReportEntity
  selected: Set<string>
  onToggle: (path: string) => void
  onToggleMany: (paths: string[], selectAll: boolean) => void
}

const ReportColumnsPanel: React.FC<TReportColumnsPanelProps> = ({ entity, selected, onToggle, onToggleMany }) => {
  const [search, setSearch] = useState('')

  const options = useMemo(() => labelledFields(entity.fields).map(({ item, label }) => ({ path: item.name, label })), [entity])
  const visible = useMemo(() => options.filter((option) => matchesSearch(option.path, option.label, search)), [options, search])
  const allSelected = useMemo(() => visible.length > 0 && visible.every((option) => selected.has(option.path)), [selected, visible])

  return (
    <ReportPanel
      title="Columns"
      description="Select which fields to include"
      action={
        <ReportSelectAll
          allSelected={allSelected}
          disabled={visible.length === 0}
          onToggle={() =>
            onToggleMany(
              visible.map((option) => option.path),
              !allSelected,
            )
          }
        />
      }
    >
      <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search fields" className="mb-2" />
      {visible.length === 0 ? (
        <p className="text-xs text-muted-foreground">No matching fields</p>
      ) : (
        <ReportFieldList options={visible} selected={selected} onToggle={onToggle} className="flex flex-col gap-1.5 max-h-64 overflow-y-auto" />
      )}
    </ReportPanel>
  )
}

export default memo(ReportColumnsPanel)
