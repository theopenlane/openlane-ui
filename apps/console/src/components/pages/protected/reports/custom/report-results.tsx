'use client'

import React, { useMemo } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { LoaderCircle } from 'lucide-react'
import { CodeBlock } from '@repo/ui/code-block'
import { DataTable } from '@repo/ui/data-table'
import Pagination from '@repo/ui/pagination'
import type { TPagination } from '@repo/ui/pagination-types'
import { Callout } from '@/components/shared/callout/callout'
import { toJson } from '@/lib/report/report-export'
import { formatCell, type TReportResult, type TReportRow } from '@/lib/report/report-rows'
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
  if (page <= 1) return { first: pagination.pageSize }

  if (page >= totalPages) {
    const remaining = result.totalCount - pagination.pageSize * (totalPages - 1)

    return { last: remaining > 0 ? remaining : pagination.pageSize }
  }

  return page > pagination.page ? { first: pagination.pageSize, after: result.pageInfo.endCursor } : { last: pagination.pageSize, before: result.pageInfo.startCursor }
}

const ReportResults: React.FC<TReportResultsProps> = ({ result, error, isLoading, view, pagination, onPaginationChange }) => {
  const tableColumns = useMemo<ColumnDef<TReportRow>[]>(
    () =>
      (result?.columns ?? []).map((column) => ({
        id: column.path,
        header: column.label,
        accessorFn: (row: TReportRow) => formatCell(row[column.path], column.field.kind),
        cell: ({ getValue }) => {
          const value = getValue<string>()
          return value === '' ? <span className="text-muted-foreground">—</span> : <span className="block truncate">{value}</span>
        },
      })),
    [result?.columns],
  )

  const json = useMemo(() => (result && view === 'json' ? toJson(result.rows, result.columns) : ''), [result, view])

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
        <p className="text-xs text-muted-foreground">
          {result.totalCount.toLocaleString()} total records, showing {result.rows.length.toLocaleString()} on this page
        </p>
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
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">{result.totalCount.toLocaleString()} total records</p>
      <DataTable
        columns={tableColumns}
        data={result.rows}
        loading={isLoading}
        tableKey={undefined}
        noResultsText="No records match this report"
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        paginationMeta={{ totalCount: result.totalCount, pageInfo: result.pageInfo, isLoading }}
      />
    </div>
  )
}

export default ReportResults
