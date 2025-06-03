'use client'

import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import React from 'react'
import { Group, GroupOrder, User } from '@repo/codegen/src/schema'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { GROUP_SORT_FIELDS } from '@/components/pages/protected/groups/table/table-config.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups.ts'
import { VisibilityState } from '@tanstack/react-table'
import { getGroupTableColumns } from '../table/columns'

type TGroupsTableProps = {
  onSortChange?: (sortCondition: any[]) => void
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  whereFilter: Record<string, any> | null
  orderByFilter: GroupOrder[] | GroupOrder | undefined
  columnVisibility?: VisibilityState
  setColumnVisibility?: React.Dispatch<React.SetStateAction<VisibilityState>>
}

const GroupsTable = ({ onSortChange, pagination, onPaginationChange, whereFilter, orderByFilter, columnVisibility, setColumnVisibility }: TGroupsTableProps) => {
  const { groups, isError, paginationMeta } = useGetAllGroups({
    where: whereFilter,
    orderBy: orderByFilter,
    pagination: pagination,
    enabled: !!whereFilter,
  })
  const { setSelectedGroup } = useGroupsStore()

  const { columns } = getGroupTableColumns()

  const handleRowClick = (group: Group) => {
    setSelectedGroup(group.id)
  }

  if (isError) {
    return <p className="text-red-500">Error loading groups</p>
  }

  return (
    <div className="mt-5">
      <DataTable
        columns={columns as ColumnDef<Group>[]}
        data={groups}
        onRowClick={handleRowClick}
        sortFields={GROUP_SORT_FIELDS}
        onSortChange={onSortChange}
        pagination={pagination}
        onPaginationChange={(pagination: TPagination) => onPaginationChange(pagination)}
        paginationMeta={paginationMeta}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
      />
    </div>
  )
}

export default GroupsTable
