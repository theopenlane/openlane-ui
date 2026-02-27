'use client'

import { DataTable } from '@repo/ui/data-table'
import React, { useEffect, useMemo } from 'react'
import { FindingWhereInput, Finding, FindingOrderField } from '@repo/codegen/src/schema'
import { getColumns } from '@/components/pages/protected/findings/table/columns.tsx'
import { FindingsNodeNonNull, useFindingsWithFilter } from '@/lib/graphql-hooks/finding'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useNotification } from '@/hooks/useNotification'
import { FINDINGS_SORT_FIELDS } from './table-config'
import { TTableProps } from '@/components/shared/crud-base/page'
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
}: TTableProps<FindingWhereInput>) => {
  const { replace } = useSmartRouter()

  const orderBy = useMemo(() => {
    if (!orderByFilter) return undefined
    return orderByFilter.map(({ field, direction }) => ({
      field: field as FindingOrderField,
      direction,
    }))
  }, [orderByFilter])

  const {
    findingsNodes: items,
    isLoading: fetching,
    data,
    isFetching,
    isError,
  } = useFindingsWithFilter({
    where: whereFilter,
    orderBy: orderBy,
    pagination,
    enabled: true,
  })

  const { errorNotification } = useNotification()

  const userIds = useMemo(() => {
    if (!items) return []
    const ids = new Set<string>()
    items.forEach((item) => {
      if (item.createdBy) ids.add(item.createdBy)
      if (item.updatedBy) ids.add(item.updatedBy)
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
    users?.forEach((u) => {
      map[u.id] = u
    })
    return map
  }, [users])

  const columns = useMemo(() => getColumns({ userMap, selectedItems, setSelectedItems }), [userMap, selectedItems, setSelectedItems])

  return (
    <DataTable<FindingsNodeNonNull, Finding>
      columns={columns}
      sortFields={FINDINGS_SORT_FIELDS}
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
        totalCount: data?.findings.totalCount,
        pageInfo: data?.findings?.pageInfo,
        isLoading: isFetching,
      }}
      columnVisibility={columnVisibility}
      setColumnVisibility={setColumnVisibility}
      tableKey={tableKey}
    />
  )
}

TableComponent.displayName = 'FindingsTable'
export default TableComponent
