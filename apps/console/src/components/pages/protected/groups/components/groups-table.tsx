'use client'

import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/table-core'
import React, { useMemo } from 'react'
import { Group, GroupOrder, GroupWhereInput } from '@repo/codegen/src/schema'
import { GROUP_SORT_FIELDS } from '@/components/pages/protected/groups/table/table-config.ts'
import { TPagination } from '@repo/ui/pagination-types'
import { useGetAllGroups } from '@/lib/graphql-hooks/groups.ts'
import { VisibilityState } from '@tanstack/react-table'
import { getGroupTableColumns } from '../table/columns'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useGetOrgUserList } from '@/lib/graphql-hooks/members'

type TGroupsTableProps = {
  onSortChange?: (sortCondition: GroupOrder | GroupOrder[]) => void
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  whereFilter: GroupWhereInput | null
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

  const { replace } = useSmartRouter()

  const userIds = useMemo(() => {
    if (!groups) return []
    const ids = new Set<string>()
    groups.forEach((group) => {
      if (group.createdBy) ids.add(group.createdBy)
      if (group.updatedBy) ids.add(group.updatedBy)
    })
    return Array.from(ids)
  }, [groups])

  const { users, isFetching: fetchingUsers } = useGetOrgUserList({
    where: { hasUserWith: [{ idIn: userIds }] },
  })

  const userMap = useMemo(() => {
    const map: Record<string, (typeof users)[0]> = {}
    users?.forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [users])

  const { columns } = useMemo(() => getGroupTableColumns({ userMap }), [userMap])

  const handleRowClick = (group: Group) => {
    replace({ id: group.id })
  }

  if (isError) {
    return <p className="text-red-500">Error loading groups</p>
  }

  return (
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
      loading={fetchingUsers}
    />
  )
}

export default GroupsTable
