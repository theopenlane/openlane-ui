'use client'

import React, { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { type ColumnDef, type RowData } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum, type TableKeyValue } from '@repo/ui/table-key'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { TruncatedCell } from '@repo/ui/truncated-cell'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { type TPagination } from '@repo/ui/pagination-types'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { RelatedControlsCell } from '@/components/shared/crud-base/columns/related-controls-cell'
import { CheckResultStatusLabel } from '@/components/shared/enum-mapper/check-result-enum'
import { Link } from '@/components/shared/link/link'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import ObjectSheetLink from '@/components/shared/object-sheet-link/object-sheet-link'
import { resolveInstallationVendor, vendorDirectoryGroupHref } from '@/lib/directory-memberships/group-memberships'
import { useVendorsByInstallation } from '@/lib/graphql-hooks/entity'
import { useHasObjectType, useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { INTEGRATION_RUNS_QUERY_KEY, type TIntegrationRunDetail } from '@/lib/graphql-hooks/integration-run'
import { integrationRunHref, readRunMetrics, type TIntegrationRunSummary } from '@/lib/integrations/run-health'
import { type MapControl } from '@/types'
import { getHrefForObjectType } from '@/utils/getHrefForObjectType'
import { pluralizeWithCount } from '@/utils/strings'
import { formatDateTime } from '@/utils/date'
import { RUN_RECORD_TYPES, runRecordCount, type TRunCheckRow, type TRunCheckType, type TRunObjectType, type TRunRecordRow, type TRunRecordSource, type TRunRecordType } from './run-record-types'

type TRunRecordsProps = {
  run: TIntegrationRunDetail
  providerId: string
  isFailed: boolean
  lastSuccess?: TIntegrationRunSummary
}

type TRecordNameCellProps = {
  record: TRunRecordRow
  type: TRunObjectType
  vendorId?: string
  onOpenSheet: (id: string, kind: ObjectAssociationNodeEnum) => void
}

const RecordNameCell = ({ record, type, vendorId, onOpenSheet }: TRecordNameCellProps) => {
  const sheetId = record.sheetId === undefined ? record.id : record.sheetId

  if (type.sheetKind && sheetId) {
    return (
      <span className="block truncate">
        <ObjectSheetLink id={sheetId} kind={type.sheetKind} label={record.name} onOpenSheet={onOpenSheet} />
      </span>
    )
  }

  return <TruncatedCell portal>{vendorId ? <Link href={vendorDirectoryGroupHref(vendorId, record.id)}>{record.name}</Link> : record.name}</TruncatedCell>
}

const updatedAtColumn = <TRow extends { updatedAt?: string | null }>(): ColumnDef<TRow> => ({
  accessorKey: 'updatedAt',
  header: 'Updated',
  size: 210,
  minSize: 190,
  cell: ({ row }) => <span className="whitespace-nowrap">{formatDateTime(row.original.updatedAt)}</span>,
})

type TRecordsTableProps<TRow extends RowData> = {
  runId: string
  source: TRunRecordSource<TRow>
  columns: ColumnDef<TRow>[]
  tableKey: TableKeyValue
  hasGatedEdge: boolean
}

const RecordsTable = <TRow extends RowData & { id: string }>({ runId, source, columns, tableKey, hasGatedEdge }: TRecordsTableProps<TRow>) => {
  const { client } = useGraphQLClient()
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: [INTEGRATION_RUNS_QUERY_KEY, 'records', runId, source.key, hasGatedEdge, pagination.page, pagination.pageSize],
    queryFn: async () => source.fetchPage(client, { integrationRunId: runId, ...pagination.query, ...(source.gatedEdge ? { [source.gatedEdge.variable]: hasGatedEdge } : {}) }),
  })

  useQueryErrorNotification({ error, description: `Failed to load ${source.label.toLowerCase()}` })

  return (
    <DataTable
      columns={columns}
      data={data?.rows ?? []}
      loading={isLoading}
      pagination={pagination}
      onPaginationChange={setPagination}
      paginationMeta={{ unknownTotalCount: true, pageInfo: data?.pageInfo, isLoading: isFetching }}
      getRowId={(row) => row.id}
      noResultsText={`No ${source.label.toLowerCase()} are linked to this run.`}
      tableKey={tableKey}
    />
  )
}

const useHasGatedEdge = ({ gatedEdge }: Pick<TRunRecordType, 'gatedEdge'>): boolean => {
  const { hasObjectType } = useModuleAccess()

  return !!gatedEdge && hasObjectType(gatedEdge.objectType)
}

const ObjectRecordsTable = ({ run, type }: { run: TIntegrationRunDetail; type: TRunObjectType }) => {
  const openObjectSheet = useOpenObjectSheet()
  const hasGatedEdge = useHasGatedEdge(type)
  const hasVendors = useHasObjectType(ObjectTypes.ENTITY)
  const installationId = type.linksToVendorDirectory && hasVendors ? run.integrationID : undefined
  const installationIds = useMemo(() => (installationId ? [installationId] : []), [installationId])
  const vendorsByInstallation = useVendorsByInstallation(installationIds)
  const vendorId = resolveInstallationVendor(installationId, vendorsByInstallation)?.id

  const columns = useMemo<ColumnDef<TRunRecordRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Record',
        size: 360,
        minSize: 200,
        cell: ({ row }) => <RecordNameCell record={row.original} type={type} vendorId={vendorId} onOpenSheet={openObjectSheet} />,
      },
      { accessorKey: 'detail', header: 'Details', size: 280, minSize: 160, cell: ({ row }) => <TruncatedCell portal>{row.original.detail}</TruncatedCell> },
      { accessorKey: 'status', header: 'Status', size: 140, minSize: 110 },
      updatedAtColumn(),
    ],
    [type, vendorId, openObjectSheet],
  )

  return <RecordsTable runId={run.id} source={type} columns={columns} tableKey={TableKeyEnum.INTEGRATION_RUN_RECORDS} hasGatedEdge={hasGatedEdge} />
}

const controlChecksHref = (control: MapControl): string => `${getHrefForObjectType(ObjectAssociationNodeEnum.CONTROL, { id: control.id })}?tab=checks`

const CONTROLS_COLUMN: ColumnDef<TRunCheckRow> = {
  accessorKey: 'controlEdges',
  header: 'Controls',
  size: 260,
  minSize: 160,
  cell: ({ row }) => <RelatedControlsCell controlEdges={row.original.controlEdges} getHref={controlChecksHref} />,
}

const CHECK_COLUMNS: ColumnDef<TRunCheckRow>[] = [
  {
    accessorKey: 'details',
    header: 'Details',
    size: 420,
    minSize: 240,
    cell: ({ row }) => (
      <TruncatedCell portal lineClamp={2}>
        {row.original.details}
      </TruncatedCell>
    ),
  },
  { accessorKey: 'status', header: 'Status', size: 140, minSize: 110, maxSize: 200, cell: ({ row }) => <CheckResultStatusLabel status={row.original.status} /> },
  updatedAtColumn(),
]

const CHECK_COLUMNS_WITH_CONTROLS: ColumnDef<TRunCheckRow>[] = [CHECK_COLUMNS[0], CONTROLS_COLUMN, ...CHECK_COLUMNS.slice(1)]

const CheckRecordsTable = ({ run, type }: { run: TIntegrationRunDetail; type: TRunCheckType }) => {
  const hasGatedEdge = useHasGatedEdge(type)

  return (
    <RecordsTable runId={run.id} source={type} columns={hasGatedEdge ? CHECK_COLUMNS_WITH_CONTROLS : CHECK_COLUMNS} tableKey={TableKeyEnum.INTEGRATION_RUN_CHECK_RESULTS} hasGatedEdge={hasGatedEdge} />
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
          <Tabs panelless value={selected.key} onValueChange={setSelectedKey} variant="solid" className="mb-3 max-w-full min-w-0">
            <TabsList className="w-fit max-w-full overflow-x-auto overflow-y-hidden">
              {writtenTypes.map((type) => (
                <TabsTrigger key={type.key} value={type.key}>
                  {type.label} <span className="ml-1.5 text-muted-foreground">{runRecordCount(run, type)}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {selected.layout === 'check' ? <CheckRecordsTable key={selected.key} run={run} type={selected} /> : <ObjectRecordsTable key={selected.key} run={run} type={selected} />}
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
            <Link href={integrationRunHref(providerId, lastSuccess.id)} className="mt-2 inline-block">
              View last successful run
            </Link>
          ) : null}
        </div>
      )}
    </section>
  )
}

export default RunRecords
