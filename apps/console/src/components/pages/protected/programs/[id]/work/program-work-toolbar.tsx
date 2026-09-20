'use client'

import React, { useMemo } from 'react'
import { LoaderCircle, SearchIcon } from 'lucide-react'
import { Input } from '@repo/ui/input'
import { TableKeyEnum } from '@repo/ui/table-key'
import { type VisibilityState } from '@repo/ui/table-types'
import { type WhereCondition } from '@/types'
import { type TTableViewMode } from '@/hooks/use-org-table-state'
import TableCardView from '@/components/shared/table-card-view/table-card-view'
import ColumnVisibilityMenu from '@/components/shared/column-visibility-menu/column-visibility-menu'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import { useUserSelect } from '@/lib/graphql-hooks/member'
import { PROGRAM_WORK_MAPPED_COLUMNS } from './program-work-columns'
import { getProgramWorkFilterFields, getProgramWorkQuickFilters } from './program-work-filters'
import { type TWorkObjectType } from './work-item'

type TProgramWorkToolbarProps = {
  viewMode: TTableViewMode
  onViewModeChange: (mode: TTableViewMode) => void
  searchTerm: string
  onSearchTermChange: (value: string) => void
  searching: boolean
  onFilterChange: (where: WhereCondition) => void
  columnVisibility: VisibilityState
  setColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  objectTypes: TWorkObjectType[]
  currentUserId?: string
}

const ProgramWorkToolbar = ({
  viewMode,
  onViewModeChange,
  searchTerm,
  onSearchTermChange,
  searching,
  onFilterChange,
  columnVisibility,
  setColumnVisibility,
  objectTypes,
  currentUserId,
}: TProgramWorkToolbarProps) => {
  const { userOptions } = useUserSelect({})

  const filterFields = useMemo(() => getProgramWorkFilterFields(userOptions, objectTypes), [userOptions, objectTypes])
  const quickFilters = useMemo(() => getProgramWorkQuickFilters(currentUserId), [currentUserId])

  return (
    <div className="flex items-center gap-2 my-2">
      <Input
        className="bg-transparent w-[280px]"
        icon={searching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
        placeholder="Search work"
        value={searchTerm}
        onChange={(event) => onSearchTermChange(event.currentTarget.value)}
        variant="searchTable"
        iconPosition="left"
      />
      <TableCardView activeTab={viewMode} onTabChange={onViewModeChange} cardLabel="Board" />
      <div className="grow flex flex-row items-center gap-2 justify-end">
        {viewMode === 'table' && (
          <ColumnVisibilityMenu mappedColumns={PROGRAM_WORK_MAPPED_COLUMNS} columnVisibility={columnVisibility} setColumnVisibility={setColumnVisibility} storageKey={TableKeyEnum.PROGRAM_WORK} />
        )}
        <TableFilter filterFields={filterFields} onFilterChange={onFilterChange} pageKey={TableKeyEnum.PROGRAM_WORK} quickFilters={quickFilters} />
      </div>
    </div>
  )
}

export default ProgramWorkToolbar
