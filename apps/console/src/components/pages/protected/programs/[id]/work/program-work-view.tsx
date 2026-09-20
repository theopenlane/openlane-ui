'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useDebounce } from '@uidotdev/usehooks'
import { DataTable } from '@repo/ui/data-table'
import { TableKeyEnum } from '@repo/ui/table-key'
import { type VisibilityState } from '@repo/ui/table-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useOrganization } from '@/hooks/useOrganization'
import { useOrgTablePagination, useOrgTableViewMode } from '@/hooks/use-org-table-state'
import { getInitialVisibility } from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { saveFilters, type TFilterState } from '@/components/shared/table-filter/filter-storage'
import { sliceByPagination } from '@/utils/pagination'
import { type WhereCondition } from '@/types'
import ProgramWorkBoard from './program-work-board'
import ProgramWorkStats from './program-work-stats'
import ProgramWorkToolbar from './program-work-toolbar'
import { PROGRAM_WORK_COLUMNS } from './program-work-columns'
import { parseProgramWorkFilters, toProgramWorkFilterState, PROGRAM_WORK_FILTER_KEYS } from './program-work-filters'
import { PROGRAM_WORK_FETCH_LIMIT, useProgramWork } from './use-program-work'
import { type TWorkObjectType } from './work-item'

type TProgramWorkViewProps = {
  programId: string
}

const ProgramWorkView = ({ programId }: TProgramWorkViewProps) => {
  const { data: session } = useSession()
  const { currentOrgId } = useOrganization()
  const [viewMode, setViewMode] = useOrgTableViewMode(TableKeyEnum.PROGRAM_WORK)
  const [pagination, setPagination, resetPagination] = useOrgTablePagination(DEFAULT_PAGINATION, TableKeyEnum.PROGRAM_WORK)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => getInitialVisibility(TableKeyEnum.PROGRAM_WORK, {}))
  const [searchTerm, setSearchTerm] = useState('')
  const [where, setWhere] = useState<WhereCondition | null>(null)
  const appliedWhereRef = useRef<string | null>(null)

  const debouncedSearch = useDebounce(searchTerm, 300)
  const searching = searchTerm !== debouncedSearch

  const filters = useMemo(() => parseProgramWorkFilters(where), [where])
  const selectedObjectTypes = filters.objectTypeIn
  const appliedFilterState = useMemo(() => toProgramWorkFilterState(where), [where])
  const { items, countsByType, totalCount, availableObjectTypes, isLoading, isFetching, isError, isTruncated, filteredCount } = useProgramWork({ programId, filters, search: debouncedSearch })

  const handleFilterChange = useCallback(
    (nextWhere: WhereCondition) => {
      const serialized = JSON.stringify(nextWhere)
      if (appliedWhereRef.current === serialized) return

      const isInitialFilters = appliedWhereRef.current === null
      appliedWhereRef.current = serialized
      setWhere(nextWhere)

      if (!isInitialFilters) resetPagination()
    },
    [resetPagination],
  )

  const handleSearchTermChange = useCallback(
    (value: string) => {
      setSearchTerm(value)
      resetPagination()
    },
    [resetPagination],
  )

  const handleSelectObjectType = useCallback(
    (objectType: TWorkObjectType | null) => {
      const nextSelected = objectType === null ? [] : selectedObjectTypes.includes(objectType) ? selectedObjectTypes.filter((entry) => entry !== objectType) : [...selectedObjectTypes, objectType]

      const nextState: TFilterState = { ...appliedFilterState, [PROGRAM_WORK_FILTER_KEYS.objectType]: nextSelected.length > 0 ? nextSelected : undefined }

      saveFilters(TableKeyEnum.PROGRAM_WORK, nextState, currentOrgId)
    },
    [currentOrgId, selectedObjectTypes, appliedFilterState],
  )

  const pagedItems = useMemo(() => sliceByPagination(items, pagination), [items, pagination])

  return (
    <div className="flex flex-col gap-4">
      <ProgramWorkStats
        countsByType={countsByType}
        totalCount={totalCount}
        objectTypes={availableObjectTypes}
        selectedObjectTypes={selectedObjectTypes}
        onSelectObjectType={handleSelectObjectType}
        isLoading={isLoading}
      />

      <ProgramWorkToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchTerm={searchTerm}
        onSearchTermChange={handleSearchTermChange}
        searching={searching}
        onFilterChange={handleFilterChange}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        objectTypes={availableObjectTypes}
        currentUserId={session?.user?.userId}
      />

      {isError && <p className="text-sm text-destructive">Some work items could not be loaded. Try refreshing the page.</p>}

      {isTruncated && !isLoading && (
        <p className="text-sm text-muted-foreground">
          Showing {items.length} of {filteredCount} matching items, up to {PROGRAM_WORK_FETCH_LIMIT} per object type. Narrow the filters to see the rest.
        </p>
      )}

      {viewMode === 'table' ? (
        <DataTable
          columns={PROGRAM_WORK_COLUMNS}
          data={pagedItems}
          loading={isLoading}
          tableKey={TableKeyEnum.PROGRAM_WORK}
          columnVisibility={columnVisibility}
          setColumnVisibility={setColumnVisibility}
          pagination={pagination}
          onPaginationChange={setPagination}
          paginationMeta={{ totalCount: items.length, isLoading: isFetching }}
          noResultsText="No outstanding work for this program"
        />
      ) : (
        <ProgramWorkBoard items={items} statuses={filters.workStatusIn} isLoading={isLoading} />
      )}
    </div>
  )
}

export default ProgramWorkView
