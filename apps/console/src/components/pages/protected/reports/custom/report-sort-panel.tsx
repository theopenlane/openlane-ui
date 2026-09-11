'use client'

import React, { memo, useId, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import type { TReportEntity } from '@repo/codegen/src/report-schema.generated'
import { OrderDirection } from '@repo/codegen/src/schema'
import { labelledOrderFields } from '@/lib/report/report-schema'
import ReportPanel from './report-panel'

const UNSORTED = 'unsorted'

const UNLIMITED = 'all'

const LIMIT_OPTIONS = [100, 500, 1000, 5000]

export type TReportSort = { field: string | null; direction: OrderDirection }

type TReportSortPanelProps = {
  entity: TReportEntity
  sort: TReportSort
  limit: number | null
  onSortChange: (sort: TReportSort) => void
  onLimitChange: (limit: number | null) => void
}

const ReportSortPanel: React.FC<TReportSortPanelProps> = ({ entity, sort, limit, onSortChange, onLimitChange }) => {
  const options = useMemo(() => labelledOrderFields(entity), [entity])
  const sortFieldId = useId()
  const directionId = useId()
  const limitId = useId()

  return (
    <ReportPanel title="Sort & limit" description="Order the records and cap how many this report pulls">
      <div className="flex flex-col gap-3">
        {options.length > 0 && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor={sortFieldId}>
                Sort by
              </label>
              <Select value={sort.field ?? UNSORTED} onValueChange={(value) => onSortChange({ ...sort, field: value === UNSORTED ? null : value })}>
                <SelectTrigger id={sortFieldId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNSORTED}>Default order</SelectItem>
                  {options.map(({ item, label }) => (
                    <SelectItem key={item} value={item}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground" htmlFor={directionId}>
                Direction
              </label>
              <Select
                value={sort.direction}
                onValueChange={(value) => onSortChange({ ...sort, direction: value === OrderDirection.DESC ? OrderDirection.DESC : OrderDirection.ASC })}
                disabled={!sort.field}
              >
                <SelectTrigger id={directionId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={OrderDirection.ASC}>Ascending</SelectItem>
                  <SelectItem value={OrderDirection.DESC}>Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground" htmlFor={limitId}>
            Maximum records
          </label>
          <Select value={limit === null ? UNLIMITED : String(limit)} onValueChange={(value) => onLimitChange(value === UNLIMITED ? null : Number(value))}>
            <SelectTrigger id={limitId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNLIMITED}>All records</SelectItem>
              {LIMIT_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  First {option.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </ReportPanel>
  )
}

export default memo(ReportSortPanel)
