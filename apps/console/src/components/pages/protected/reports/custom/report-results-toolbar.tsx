'use client'

import React, { useId } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { EXPORT_FORMAT_LABELS, EXPORT_FORMATS, type TReportExportFormat } from '@/lib/report/report-export'
import { RELATED_RECORD_LIMIT } from '@/lib/report/build-report-query'
import type { TRowPerOption } from '@/lib/report/report-rows'
import { PATH_SEPARATOR } from '@/lib/report/report-schema'

export type TReportView = 'table' | 'json'

export const ROW_PER_RECORD = PATH_SEPARATOR

type TReportResultsToolbarProps = {
  summary: string | null
  recordLabel: string
  rowPerOptions: TRowPerOption[]
  rowPer: string
  onRowPerChange: (rowPer: string) => void
  view: TReportView
  onViewChange: (view: TReportView) => void
  canExport: boolean
  isExporting: boolean
  onExport: (format: TReportExportFormat) => void
}

const ReportResultsToolbar: React.FC<TReportResultsToolbarProps> = ({ summary, recordLabel, rowPerOptions, rowPer, onRowPerChange, view, onViewChange, canExport, isExporting, onExport }) => {
  const rowPerLabelId = useId()
  const formatLabelId = useId()

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {summary && (
        <p className="text-xs text-muted-foreground">
          {summary}
          {rowPer !== ROW_PER_RECORD && ` · up to the first ${RELATED_RECORD_LIMIT} linked records each`}
        </p>
      )}

      <div className="flex min-w-0 max-w-full items-center gap-2 ml-auto flex-wrap">
        {rowPerOptions.length > 0 && (
          <>
            <span id={rowPerLabelId} className="text-sm text-muted-foreground">
              One row per
            </span>
            <Select value={rowPer} onValueChange={onRowPerChange}>
              <SelectTrigger className="h-8 w-48 max-w-full text-sm" aria-labelledby={rowPerLabelId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ROW_PER_RECORD}>{recordLabel}</SelectItem>
                {rowPerOptions.map(({ path, label }) => (
                  <SelectItem key={path} value={path}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        <span id={formatLabelId} className="text-sm text-muted-foreground">
          Format
        </span>
        <Select value={view} onValueChange={(value) => onViewChange(value === 'json' ? 'json' : 'table')}>
          <SelectTrigger className="h-8 w-28 text-sm" aria-labelledby={formatLabelId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="table">Table</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="md" icon={<Download size={14} />} iconPosition="left" loading={isExporting} disabled={!canExport || isExporting}>
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {EXPORT_FORMATS.map((format) => (
              <DropdownMenuItem key={format} onClick={() => onExport(format)}>
                {EXPORT_FORMAT_LABELS[format]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default ReportResultsToolbar
