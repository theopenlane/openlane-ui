'use client'

import React, { useMemo, useState } from 'react'
import { DataTable, type SortCondition } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { type VisibilityState } from '@repo/ui/table-types'
import { CheckResultOrderField, OrderDirection, type CheckResultWhereInput } from '@repo/codegen/src/schema'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import ColumnVisibilityMenu, { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { getIncludeVars } from '@/components/shared/crud-base/columns/get-include-vars'
import { getMappedColumns } from '@/components/shared/crud-base/columns/get-mapped-columns'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { useCheckResultsWithFilter } from '@/lib/graphql-hooks/check-result'
import { useOrgTablePagination, useOrgTableSort } from '@/hooks/use-org-table-state'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useCanManageIntegrations } from '@/lib/authz/use-can-manage-integrations'
import { useOpenObjectSheet } from '@/providers/sheet-navigation-provider'
import { isOneOf } from '@/utils/type-guards'
import { CHECK_HIDDEN_COLUMNS, CHECK_SORT_FIELDS, getCheckColumns } from './checks-columns'
import { CHECK_PERIOD_LABELS, CHECK_PERIODS, CHECK_STATUS_FILTERS, type TCheckFilters, type TCheckFiltersState } from './use-check-filters'

const isStatusFilter = isOneOf(CHECK_STATUS_FILTERS)
const isPeriod = isOneOf(CHECK_PERIODS)

const DEFAULT_CHECK_SORT: SortCondition<CheckResultOrderField>[] = [
  { field: CheckResultOrderField.updated_at, direction: OrderDirection.DESC },
  { field: CheckResultOrderField.STATUS, direction: OrderDirection.ASC },
]

const emptyTextFor = ({ status, period }: TCheckFilters): string => {
  const statusText = status === 'ALL' ? 'checks' : `checks with status ${getEnumLabel(status)}`
  const periodText = period === 'all' ? '' : ` updated in the ${CHECK_PERIOD_LABELS[period].toLowerCase()}`

  return `No ${statusText}${periodText}.`
}

type ChecksTabProps = {
  controlId: string
  filtersState: TCheckFiltersState
}

const ChecksTab: React.FC<ChecksTabProps> = ({ controlId, filtersState }) => {
  const { filters, setStatus, setPeriod } = filtersState
  const openObjectSheet = useOpenObjectSheet()
  const { canManageIntegrations } = useCanManageIntegrations()
  const [orderBy, setOrderBy] = useOrgTableSort(TableKeyEnum.CONTROL_CHECK_RESULTS, CheckResultOrderField, DEFAULT_CHECK_SORT)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.CONTROL_CHECK_RESULTS, CHECK_HIDDEN_COLUMNS))

  const columns = useMemo(() => getCheckColumns({ onOpenSheet: openObjectSheet, canManageIntegrations }), [openObjectSheet, canManageIntegrations])
  const mappedColumns = useMemo(() => getMappedColumns(columns), [columns])
  const includeVars = useMemo(() => getIncludeVars(columns, columnVisibility), [columns, columnVisibility])

  const where = useMemo<CheckResultWhereInput>(
    () => ({
      hasControlsWith: [{ id: controlId }],
      ...(filters.status === 'ALL' ? {} : { status: filters.status }),
      ...(filters.since ? { updatedAtGTE: filters.since } : {}),
    }),
    [controlId, filters.status, filters.since],
  )

  const [pagination, setPagination] = useOrgTablePagination(DEFAULT_PAGINATION, TableKeyEnum.CONTROL_CHECK_RESULTS, {
    restorePage: { where, orderBy, ready: true },
  })

  const { checkResultsNodes, data, isPending, isPlaceholderData, isFetching, error } = useCheckResultsWithFilter({ where, orderBy, pagination, includeVars })

  useQueryErrorNotification({ error, description: 'Failed to load check results' })

  const paginationMeta = useMemo(
    () => ({
      totalCount: data?.checkResults.totalCount ?? 0,
      pageInfo: data?.checkResults.pageInfo,
      isLoading: isFetching,
    }),
    [data, isFetching],
  )

  const selectStatus = (value: string) => {
    if (!isStatusFilter(value)) return
    setStatus(value)
  }

  const selectPeriod = (value: string) => {
    if (!isPeriod(value)) return
    setPeriod(value)
  }

  return (
    <div>
      <h3 className="mb-2 text-base font-semibold">Checks</h3>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Tabs value={filters.status} onValueChange={selectStatus} variant="solid" className="max-w-full">
          <TabsList className="w-fit max-w-full overflow-x-auto" aria-label="Check status">
            {CHECK_STATUS_FILTERS.map((value) => (
              <TabsTrigger key={value} value={value}>
                {getEnumLabel(value)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filters.period} onValueChange={selectPeriod}>
            <SelectTrigger className="w-[160px]" aria-label="Updated within">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHECK_PERIODS.map((value) => (
                <SelectItem key={value} value={value}>
                  {CHECK_PERIOD_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ColumnVisibilityMenu mappedColumns={mappedColumns} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.CONTROL_CHECK_RESULTS} />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={isPlaceholderData ? [] : checkResultsNodes}
        loading={isPending || isPlaceholderData}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        sortFields={CHECK_SORT_FIELDS}
        sorting={orderBy}
        onSortChange={setOrderBy}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={TableKeyEnum.CONTROL_CHECK_RESULTS}
        noResultsText={emptyTextFor(filters)}
      />
    </div>
  )
}

export default ChecksTab
