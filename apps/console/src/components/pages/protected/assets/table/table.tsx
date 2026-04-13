'use client'

import { DataTable } from '@repo/ui/data-table'
import React, { useEffect, useMemo } from 'react'
import { type AssetWhereInput, type Asset, type AssetOrderField } from '@repo/codegen/src/schema'
import { getColumns } from '@/components/pages/protected/assets/table/columns.tsx'
import { type AssetsNodeNonNull, useAssetsWithFilter } from '@/lib/graphql-hooks/asset'
import { useGetOrgUserList } from '@/lib/graphql-hooks/member'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useNotification } from '@/hooks/useNotification'
import { ASSETS_SORT_FIELDS } from './table-config'
import { type TTableProps } from '@/components/shared/crud-base/page'
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
  rowHref,
}: TTableProps<AssetWhereInput>) => {
  const { replace } = useSmartRouter()

  const orderBy = useMemo(() => {
    if (!orderByFilter) return undefined
    return orderByFilter.map(({ field, direction }) => ({
      field: field as AssetOrderField,
      direction,
    }))
  }, [orderByFilter])

  const {
    assetsNodes: items,
    isLoading: fetching,
    data,
    isFetching,
    isError,
  } = useAssetsWithFilter({
    where: whereFilter,
    orderBy: orderBy,
    pagination,
    enabled: true,
  })

  const { convertToReadOnly } = usePlateEditor()
  const { errorNotification } = useNotification()
  const userIds = useMemo(() => {
    if (!items) return []
    const ids = new Set<string>()
    items.forEach((item) => {
      if (item.createdBy) ids.add(item.createdBy)
      if (item.updatedBy) ids.add(item.updatedBy)
      if (item.internalOwnerUser?.id) ids.add(item.internalOwnerUser.id)
    })
    return Array.from(ids)
  }, [items])

  const hastItems = useMemo(() => {
    return items && items.length > 0
  }, [items])

  useEffect(() => {
    if (onHasChange) {
      onHasChange(hastItems)
    }
  }, [hastItems, onHasChange])

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

  const columns = useMemo(() => getColumns({ userMap, convertToReadOnly, selectedItems, setSelectedItems }), [userMap, convertToReadOnly, selectedItems, setSelectedItems])

  return (
    <DataTable<AssetsNodeNonNull, Asset>
      columns={columns}
      sortFields={ASSETS_SORT_FIELDS}
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
        totalCount: data?.assets.totalCount,
        pageInfo: data?.assets?.pageInfo,
        isLoading: isFetching,
      }}
      columnVisibility={columnVisibility}
      setColumnVisibility={setColumnVisibility}
      tableKey={tableKey}
    />
  )
}

TableComponent.displayName = 'AssetsTable'
export default TableComponent
