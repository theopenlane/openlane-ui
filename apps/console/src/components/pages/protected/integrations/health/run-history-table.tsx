'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoaderCircle, SearchIcon } from 'lucide-react'
import { type VisibilityState } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { Input } from '@repo/ui/input'
import { TableKeyEnum } from '@repo/ui/table-key'
import { IntegrationRunOrderField, type IntegrationRunWhereInput } from '@repo/codegen/src/schema'
import { NEWEST_RUNS_FIRST, useIntegrationRuns } from '@/lib/graphql-hooks/integration-run'
import { useOrgTablePagination, useOrgTableSort } from '@/hooks/use-org-table-state'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useAsyncCommandSearch } from '@/hooks/useAsyncCommandSearch'
import { useCopyWithNotification } from '@/hooks/useCopyWithNotification'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { getMappedColumns } from '@/components/shared/crud-base/columns/get-mapped-columns'
import { createRowActionsColumn } from '@/components/shared/crud-base/columns/row-actions-column'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { identityFilterKey, whereGenerator } from '@/components/shared/table-filter/where-generator'
import { mergeWhere } from '@/lib/merge-where'
import { integrationRunHref } from '@/lib/integrations/run-health'
import {
  RUN_HISTORY_HIDDEN_COLUMNS,
  RUN_HISTORY_QUICK_FILTERS,
  RUN_HISTORY_SORT_FIELDS,
  getRunHistoryColumns,
  runHistoryFilterFields,
  runSearchWhere,
  toRunHistoryRow,
  type TRunHistoryRow,
} from './run-history-config'

type TRunHistoryTableProps = {
  providerId: string
  integrationIds: string[]
  instanceLabels: Map<string, string>
  operationNames: string[]
  canManage: boolean
  onHealthCheck: (integrationId: string) => void
}

const DEFAULT_SORT = [NEWEST_RUNS_FIRST]

const RunHistoryTable = ({ providerId, integrationIds, instanceLabels, operationNames, canManage, onHealthCheck }: TRunHistoryTableProps) => {
  const router = useRouter()
  const copyToClipboard = useCopyWithNotification()
  const [pagination, setPagination, resetPagination] = useOrgTablePagination(DEFAULT_PAGINATION, TableKeyEnum.INTEGRATION_RUNS)
  const [orderBy, setOrderBy] = useOrgTableSort(TableKeyEnum.INTEGRATION_RUNS, IntegrationRunOrderField, DEFAULT_SORT)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.INTEGRATION_RUNS, RUN_HISTORY_HIDDEN_COLUMNS))
  const [filters, setFilters] = useState<IntegrationRunWhereInput | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearchTermChange = useCallback(
    (value: string) => {
      setSearchTerm(value)
      resetPagination()
    },
    [resetPagination],
  )

  const { searchText, setSearchText, debouncedTerm, getIsSearching } = useAsyncCommandSearch({ controlled: { value: searchTerm, onValueChange: handleSearchTermChange } })

  const handleFilterChange = useCallback(
    (next: IntegrationRunWhereInput) => {
      setFilters(next)
      resetPagination()
    },
    [resetPagination],
  )

  const where = useMemo(
    () =>
      filters
        ? mergeWhere<IntegrationRunWhereInput>([
            { integrationIDIn: integrationIds },
            whereGenerator(filters, identityFilterKey<IntegrationRunWhereInput>),
            debouncedTerm ? runSearchWhere(debouncedTerm) : undefined,
          ])
        : null,
    [filters, debouncedTerm, integrationIds],
  )

  const { data, runs, isLoading, isFetching, isPlaceholderData, error } = useIntegrationRuns({
    where: where ?? {},
    orderBy: orderBy[0] ?? NEWEST_RUNS_FIRST,
    pagination,
    enabled: !!where && integrationIds.length > 0,
  })

  useQueryErrorNotification({ error, description: 'Failed to load run history' })

  const showInstance = integrationIds.length > 1
  const rows = useMemo(() => runs.map((run) => toRunHistoryRow(run, instanceLabels.get(run.integrationID ?? '') ?? '-')), [runs, instanceLabels])
  const filterFields = useMemo(() => runHistoryFilterFields(operationNames), [operationNames])

  const columns = useMemo(
    () => [
      ...getRunHistoryColumns(showInstance),
      createRowActionsColumn<TRunHistoryRow>({
        label: 'Run actions',
        actions: [
          { label: 'View run details', onClick: (run) => router.push(integrationRunHref(providerId, run.id)) },
          { label: 'Copy error', onClick: (run) => copyToClipboard(run.error ?? '', 'Error'), hidden: (run) => !run.error },
          { label: 'Copy run ID', onClick: (run) => copyToClipboard(run.id, 'Run ID') },
          { label: 'Health check this instance', onClick: (run) => run.integrationID && onHealthCheck(run.integrationID), hidden: (run) => !canManage || !run.integrationID },
        ],
      }),
    ],
    [showInstance, router, providerId, copyToClipboard, canManage, onHealthCheck],
  )

  const mappedColumns = useMemo(() => getMappedColumns(columns), [columns])
  const isFiltered = !!debouncedTerm || Object.keys(filters ?? {}).length > 0
  const isSearching = getIsSearching(isFetching && !!debouncedTerm)

  return (
    <section>
      <h3 className="mb-3 text-lg font-medium">Run history</h3>
      <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-2">
        <Input
          icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
          placeholder="Search..."
          aria-label="Search run history"
          value={searchText}
          onChange={(event) => setSearchText(event.currentTarget.value)}
          variant="searchTable"
          className="w-full max-w-[320px]"
        />
        <div className="flex items-center justify-end gap-2">
          <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.INTEGRATION_RUNS} />
          <TableFilter filterFields={filterFields} onFilterChange={handleFilterChange} pageKey={TableKeyEnum.INTEGRATION_RUNS} quickFilters={RUN_HISTORY_QUICK_FILTERS} />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        loading={!where || isLoading || (isPlaceholderData && rows.length === 0)}
        sortFields={RUN_HISTORY_SORT_FIELDS}
        sorting={orderBy}
        onSortChange={(next) => {
          setOrderBy(next)
          resetPagination()
        }}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={{ unknownTotalCount: true, pageInfo: data?.integrationRuns?.pageInfo, isLoading: isFetching }}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        rowHref={(run) => integrationRunHref(providerId, run.id)}
        getRowId={(run) => run.id}
        noResultsText={isFiltered ? 'No runs match the current search or filters.' : 'No runs have been recorded for this integration yet.'}
        tableKey={TableKeyEnum.INTEGRATION_RUNS}
      />
    </section>
  )
}

export default RunHistoryTable
