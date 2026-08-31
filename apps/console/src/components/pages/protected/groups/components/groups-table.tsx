'use client'

import { DataTable } from '@repo/ui/data-table'
import { type ColumnDef } from '@repo/ui/table-types'
import React, { useMemo } from 'react'
import { type GroupOrder, type GroupWhereInput } from '@repo/codegen/src/schema'
import { GROUP_SORT_FIELDS } from '@/components/pages/protected/groups/table/table-config.ts'
import { type TPagination } from '@repo/ui/pagination-types'
import { useGetAllGroups, type GroupsNode } from '@/lib/graphql-hooks/group'
import { type VisibilityState } from '@repo/ui/table-types'
import { getGroupTableColumns } from '../table/columns'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
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
  const { groups, error, paginationMeta } = useGetAllGroups({
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

  const { userMap, tokenMap, isLoading: fetchingUsers } = useAuthorMaps(userIds)

  const { columns } = useMemo(() => getGroupTableColumns({ userMap, tokenMap }), [userMap, tokenMap])

  const handleRowClick = (group: GroupsNode) => {
    replace({ id: group.id })
  }

  useQueryErrorNotification({ error, description: 'Failed to load groups' })

  return (
    <DataTable
      columns={columns as ColumnDef<GroupsNode>[]}
      data={groups}
      onRowClick={handleRowClick}
      sortFields={GROUP_SORT_FIELDS}
      sorting={Array.isArray(orderByFilter) ? orderByFilter : orderByFilter ? [orderByFilter] : undefined}
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
