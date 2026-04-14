'use client'

import { DataTable } from '@repo/ui/data-table'
import React, { useEffect, useMemo } from 'react'
import { type ScanWhereInput, type Scan, type ScanOrderField } from '@repo/codegen/src/schema'
import { getColumns } from '@/components/pages/protected/scans/table/columns.tsx'
import { type ScansNodeNonNull, useScansWithFilter } from '@/lib/graphql-hooks/scan'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useNotification } from '@/hooks/useNotification'
import { SCANS_SORT_FIELDS } from './table-config'
import { type TTableProps } from '@/components/shared/crud-base/page'
import { objectName, tableKey } from './types'
import { isUlid } from '@/lib/validators'

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
  rowHref,
}: TTableProps<ScanWhereInput>) => {
  const { replace } = useSmartRouter()

  const orderBy = useMemo(() => {
    if (!orderByFilter) return undefined
    return orderByFilter.map(({ field, direction }) => ({
      field: field as ScanOrderField,
      direction,
    }))
  }, [orderByFilter])

  const {
    scansNodes: items,
    isLoading: fetching,
    data,
    isFetching,
    isError,
  } = useScansWithFilter({
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
      if (item.createdBy && isUlid(item.createdBy)) ids.add(item.createdBy)
      if (item.updatedBy && isUlid(item.updatedBy)) ids.add(item.updatedBy)
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
    <DataTable<ScansNodeNonNull, Scan>
      columns={columns}
      sortFields={SCANS_SORT_FIELDS}
      onSortChange={onSortChange}
      data={items}
      loading={fetching || fetchingUsers}
      defaultSorting={defaultSorting}
      onRowClick={(item) => {
        replace({ id: item.id })
      }}
      rowHref={rowHref}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      paginationMeta={{
        totalCount: data?.scans.totalCount,
        pageInfo: data?.scans?.pageInfo,
        isLoading: isFetching,
      }}
      columnVisibility={columnVisibility}
      setColumnVisibility={setColumnVisibility}
      tableKey={tableKey}
    />
  )
}

TableComponent.displayName = 'ScansTable'
export default TableComponent
