'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import { type TPagination } from '@repo/ui/pagination-types'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { INTEGRATION_RUNS_QUERY_KEY, type TIntegrationRunDetail } from '@/lib/graphql-hooks/integration-run'
import { integrationRunHref, readRunMetrics, type TIntegrationRunSummary } from '@/lib/integrations/run-health'
import { pluralizeWithCount } from '@/utils/strings'
import { formatDateTime } from '@/utils/date'
import { RUN_RECORD_TYPES, runRecordCount, type TRunRecordRow, type TRunRecordType } from './run-record-types'

type TRunRecordsProps = {
  run: TIntegrationRunDetail
  providerId: string
  isFailed: boolean
  lastSuccess?: TIntegrationRunSummary
}

const RunRecordsTable = ({ runId, type }: { runId: string; type: TRunRecordType }) => {
  const { client } = useGraphQLClient()
  const openObjectSheet = useOpenObjectSheet()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [INTEGRATION_RUNS_QUERY_KEY, 'records', runId, type.key, pagination.page, pagination.pageSize],
    queryFn: async () => type.fetchPage(client, { integrationRunId: runId, ...pagination.query }),
  })

  useQueryErrorNotification({ error, description: `Failed to load ${type.label.toLowerCase()}` })

  const columns = useMemo<ColumnDef<TRunRecordRow>[]>(() => {
    const sheetKind = type.sheetKind

    return [
      {
        accessorKey: 'name',
        header: 'Record',
        size: 360,
        minSize: 200,
        cell: ({ row }) =>
          sheetKind ? (
            <span className="block truncate">
              <ObjectSheetLink id={row.original.id} kind={sheetKind} label={row.original.name} onOpenSheet={openObjectSheet} />
            </span>
          ) : (
            <TruncatedCell portal>{row.original.name}</TruncatedCell>
          ),
      },
      { accessorKey: 'detail', header: 'Details', size: 280, minSize: 160, cell: ({ row }) => <TruncatedCell portal>{row.original.detail}</TruncatedCell> },
      { accessorKey: 'status', header: 'Status', size: 140, minSize: 110 },
      { accessorKey: 'updatedAt', header: 'Updated', size: 210, minSize: 190, cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.updatedAt)}</span> },
    ]
  }, [type.sheetKind, openObjectSheet])

  return (
    <DataTable
      columns={columns}
      data={data?.rows ?? []}
      loading={isLoading}
      pagination={pagination}
      onPaginationChange={setPagination}
      paginationMeta={{ totalCount: data?.totalCount, pageInfo: data?.pageInfo, isLoading: isFetching }}
      getRowId={(row) => row.id}
      noResultsText={`No ${type.label.toLowerCase()} are linked to this run.`}
      tableKey={TableKeyEnum.INTEGRATION_RUN_RECORDS}
    />
  )
}

const RunRecords = ({ run, providerId, isFailed, lastSuccess }: TRunRecordsProps) => {
  const writtenTypes = useMemo(() => RUN_RECORD_TYPES.filter((type) => runRecordCount(run, type) > 0), [run])
  const [selectedKey, setSelectedKey] = useState<string>()
  const selected = writtenTypes.find((type) => type.key === selectedKey) ?? writtenTypes[0]
  const checkedCount = readRunMetrics(run.metrics)?.persisted ?? 0

  return (
    <section>
      <h3 className="text-lg font-medium">Records written by this run</h3>
      <p className="mb-3 text-sm text-muted-foreground">Records this run created or changed. Records it found unchanged are not listed.</p>
      {selected ? (
        <>
          <Tabs value={selected.key} onValueChange={setSelectedKey} variant="solid" className="mb-3 max-w-full min-w-0">
            <TabsList className="w-fit max-w-full overflow-x-auto overflow-y-hidden">
              {writtenTypes.map((type) => (
                <TabsTrigger key={type.key} value={type.key}>
                  {type.label} <span className="ml-1.5 text-muted-foreground">{runRecordCount(run, type)}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <RunRecordsTable key={selected.key} runId={run.id} type={selected} />
        </>
      ) : (
        <div className="rounded-lg border border-dashed px-4 py-5 text-sm">
          <p className="font-medium">No records were written.</p>
          {isFailed ? (
            <p className="mt-1 text-muted-foreground">
              Existing records are unchanged.
              {lastSuccess ? ` The last successful ${run.operationName || 'run'} finished ${formatDateTime(lastSuccess.finishedAt)}.` : ''}
            </p>
          ) : (
            <p className="mt-1 text-muted-foreground">
              {checkedCount > 0
                ? `The ${pluralizeWithCount(checkedCount, 'record')} this run checked ${checkedCount === 1 ? 'was' : 'were'} already up to date.`
                : 'This run did not create or change any records.'}
            </p>
          )}
          {isFailed && lastSuccess ? (
            <Link href={integrationRunHref(providerId, lastSuccess.id)} className="mt-2 inline-block text-blue-500 hover:underline">
              View last successful run
            </Link>
          ) : null}
        </div>
      )}
    </section>
  )
}

export default RunRecords
