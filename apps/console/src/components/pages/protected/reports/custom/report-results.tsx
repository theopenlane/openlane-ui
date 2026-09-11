'use client'

import React, { useMemo } from 'react'
import { LoaderCircle } from 'lucide-react'
import { CodeBlock } from '@repo/ui/code-block'
import { DataTable } from '@repo/ui/data-table'
import type { ColumnDef } from '@repo/ui/table-types'
import Pagination from '@repo/ui/pagination'
import type { TPagination } from '@repo/ui/pagination-types'
import { Callout } from '@/components/shared/callout/callout'
import { toJson } from '@/lib/report/report-export'
import { formatCell, rowsForPage, type TReportResult, type TReportRow } from '@/lib/report/report-rows'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type TReportResultsProps = {
  result: TReportResult | undefined
  error: Error | null
  isLoading: boolean
  view: 'table' | 'json'
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
}

const pageQueryFor = (page: number, pagination: TPagination, totalPages: number, result: TReportResult): TPagination['query'] => {
  const pageInfo = result.pageInfo
  if (!pageInfo || page <= 1) return { first: pagination.pageSize }

  if (page >= totalPages) {
    const remaining = result.totalCount - pagination.pageSize * (totalPages - 1)

    return { last: remaining > 0 ? remaining : pagination.pageSize }
  }

  return page > pagination.page ? { first: pagination.pageSize, after: pageInfo.endCursor } : { last: pagination.pageSize, before: pageInfo.startCursor }
}

const ReportResults: React.FC<TReportResultsProps> = ({ result, error, isLoading, view, pagination, onPaginationChange }) => {
  const tableColumns = useMemo<ColumnDef<TReportRow>[]>(
    () =>
      (result?.columns ?? []).map((column) => {
        const cellValue = (row: TReportRow) => formatCell(row[column.path], column.field.kind)

        return {
          id: column.path,
          header: column.label,
          accessorFn: cellValue,
          cell: ({ row }) => {
            const value = cellValue(row.original)
            return value === '' ? <span className="text-muted-foreground">—</span> : <span className="block truncate">{value}</span>
          },
        }
      }),
    [result?.columns],
  )

  const rows = useMemo(() => (result ? rowsForPage(result, pagination) : []), [pagination, result])

  const json = useMemo(() => (result && view === 'json' ? toJson(rows, result.columns) : ''), [result, rows, view])

  if (error) {
    return (
      <Callout variant="danger" title="We could not run this report">
        {parseErrorMessage(error)}
      </Callout>
    )
  }

  if (!result) {
    return isLoading ? (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <LoaderCircle className="animate-spin" size={16} />
        Running your report
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="font-medium">Ready to build your report</p>
        <p className="text-sm text-muted-foreground max-w-sm">Choose what to report on, pick the columns you want, optionally add filters, then run the report.</p>
      </div>
    )
  }

  if (view === 'json') {
    const totalPages = Math.max(1, Math.ceil(result.totalCount / pagination.pageSize))

    return (
      <div className="flex flex-col gap-3">
        <CodeBlock code={json} language="json" />
        <Pagination
          currentPage={pagination.page}
          totalPages={totalPages}
          pageSize={pagination.pageSize}
          onPageChange={(page) => onPaginationChange({ ...pagination, page, query: pageQueryFor(page, pagination, totalPages, result) })}
          onPageSizeChange={(pageSize) => onPaginationChange({ page: 1, pageSize, query: { first: pageSize } })}
        />
      </div>
    )
  }

  return (
    <DataTable
      columns={tableColumns}
      data={rows}
      loading={isLoading}
      tableKey={undefined}
      noResultsText="No records match this report"
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      paginationMeta={{ totalCount: result.totalCount, pageInfo: result.pageInfo, isLoading }}
    />
  )
}

export default ReportResults
