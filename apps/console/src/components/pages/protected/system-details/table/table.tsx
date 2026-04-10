'use client'

import { useEffect, useMemo } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { type SystemDetail, type SystemDetailOrderField, type SystemDetailWhereInput } from '@repo/codegen/src/schema'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { type SystemDetailsNodeNonNull, useSystemDetailsWithFilter } from '@/lib/graphql-hooks/system-detail'
import { useNotification } from '@/hooks/useNotification'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { type TTableProps } from '@/components/shared/crud-base/page'
import { getColumns } from './columns'
import { SYSTEM_DETAILS_SORT_FIELDS } from './table-config'
import { objectName, tableKey } from './types'

const TableComponent = ({
  onSortChange,
  pagination,
  onPaginationChange,
  whereFilter,
  orderByFilter,
  columnVisibility,
  setColumnVisibility,
  onHasChange,
  selectedItems,
  setSelectedItems,
  canEdit,
  permission,
  defaultSorting,
}: TTableProps<SystemDetailWhereInput>) => {
  const { replace } = useSmartRouter()

  const orderBy = useMemo(() => {
    if (!orderByFilter) {
      return undefined
    }

    return orderByFilter.map(({ field, direction }) => ({
      field: field as SystemDetailOrderField,
      direction,
    }))
  }, [orderByFilter])

  const {
    systemDetailsNodes: items,
    isLoading: fetching,
    data,
    isFetching,
    isError,
  } = useSystemDetailsWithFilter({
    where: whereFilter,
    orderBy,
    pagination,
    enabled: true,
  })

  const { errorNotification } = useNotification()

  const userIds = useMemo(() => {
    if (!items) {
      return []
    }

    const ids = new Set<string>()
    items.forEach((item) => {
      if (item.createdBy) {
        ids.add(item.createdBy)
      }
      if (item.updatedBy) {
        ids.add(item.updatedBy)
      }
    })
    return Array.from(ids)
  }, [items])

  const hasItems = useMemo(() => {
    return items && items.length > 0
  }, [items])

  useEffect(() => {
    if (onHasChange) {
      onHasChange(hasItems)
    }
  }, [hasItems, onHasChange])

  useEffect(() => {
    if (permission?.roles) {
      setColumnVisibility((prev) => ({
        ...prev,
        select: canEdit(permission.roles),
      }))
    }
  }, [permission?.roles, setColumnVisibility, canEdit])

  useEffect(() => {
    if (isError) {
      errorNotification({
        title: 'Error',
        description: `Failed to load ${objectName.toLowerCase()}`,
      })
    }
  }, [isError, errorNotification])

  const { users, isFetching: fetchingUsers } = useGetOrgUserList({
    where: { hasUserWith: [{ idIn: userIds }] },
  })

  const userMap = useMemo(() => {
    const map: Record<string, (typeof users)[0]> = {}
    users?.forEach((user) => {
      map[user.id] = user
    })
    return map
  }, [users])

  const columns = useMemo(() => getColumns({ userMap, selectedItems, setSelectedItems }), [userMap, selectedItems, setSelectedItems])

  return (
    <DataTable<SystemDetailsNodeNonNull, SystemDetail>
      columns={columns}
      sortFields={SYSTEM_DETAILS_SORT_FIELDS}
      onSortChange={onSortChange}
      data={items}
      loading={fetching || fetchingUsers}
      defaultSorting={defaultSorting}
      onRowClick={(item) => {
        replace({ id: item.id })
      }}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      paginationMeta={{
        totalCount: data?.systemDetails?.totalCount,
        pageInfo: data?.systemDetails?.pageInfo,
        isLoading: isFetching,
      }}
      columnVisibility={columnVisibility}
      setColumnVisibility={setColumnVisibility}
      tableKey={tableKey}
    />
  )
}

TableComponent.displayName = 'SystemDetailsTable'

export default TableComponent
