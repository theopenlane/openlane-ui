'use client'

import { DataTable } from '@repo/ui/data-table'
import { type ColumnDef } from '@tanstack/table-core'
import React, { useEffect, useMemo } from 'react'
import { type Group, type GroupOrder, type GroupWhereInput } from '@repo/codegen/src/schema'
import { GROUP_SORT_FIELDS } from '@/components/pages/protected/groups/table/table-config.ts'
import { type TPagination } from '@repo/ui/pagination-types'
import { useGetAllGroups } from '@/lib/graphql-hooks/group'
import { type VisibilityState } from '@tanstack/react-table'
import { getGroupTableColumns } from '../table/columns'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { useNotification } from '@/hooks/useNotification'
import { TableKeyEnum } from '@repo/ui/table-key'

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
  const { errorNotification } = useNotification()
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

  const { userMap, tokenMap, isLoading: fetchingUsers } = useAuthorMaps(userIds)

  const { columns } = useMemo(() => getGroupTableColumns({ userMap, tokenMap }), [userMap, tokenMap])

  const handleRowClick = (group: Group) => {
    replace({ id: group.id })
  }

  useEffect(() => {
    if (isError) {
      errorNotification({
        title: 'Error',
        description: 'Failed to load groups',
      })
    }
  }, [isError, errorNotification])

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
      tableKey={TableKeyEnum.GROUP}
    />
  )
}

export default GroupsTable
