'use client'

import { DataTable } from '@repo/ui/data-table'
import React, { useEffect, useMemo } from 'react'
import { type EntityWhereInput, type EntityOrderField } from '@repo/codegen/src/schema'
import { type EntitiesNodeNonNull, useVendorsWithFilter } from '@/lib/graphql-hooks/entity'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { VENDORS_SORT_FIELDS } from './table-config'
import { getColumns } from './columns'
import { type TTableProps } from '@/components/shared/crud-base/page'
import { objectName, tableKey } from './types'
import { isUlid } from '@/lib/validators'
import { useSession } from 'next-auth/react'
import { canDelete } from '@/lib/authz/utils'
import { useMergeDragDrop } from '@/components/shared/merge-records/use-merge-drag-drop'
import { vendorMergeConfig, getVendorLabel } from '@/components/shared/merge-records/configs/vendor-merge-config'

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
}: TTableProps<EntityWhereInput>) => {
  const orderBy = useMemo(() => {
    if (!orderByFilter) return undefined
    return orderByFilter.map(({ field, direction }) => ({
      field: field as EntityOrderField,
      direction,
    }))
  }, [orderByFilter])

  const {
    vendorNodes: items,
    isLoading: fetching,
    data,
    isFetching,
    error,
  } = useVendorsWithFilter({
    where: whereFilter,
    orderBy: orderBy,
    pagination,
    enabled: true,
  })

  const { convertToReadOnly } = usePlateEditor()
  const { data: session } = useSession()
  const userIds = useMemo(() => {
    if (!items) return []
    const ids = new Set<string>()
    items.forEach((item) => {
      if (item.createdBy && isUlid(item.createdBy)) ids.add(item.createdBy)
      if (item.updatedBy && isUlid(item.updatedBy)) ids.add(item.updatedBy)
      if (item.internalOwnerUser?.id) ids.add(item.internalOwnerUser.id)
      if (item.reviewedByUser?.id) ids.add(item.reviewedByUser.id)
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

  const canEditRows = canEdit(permission?.roles, session)

  useEffect(() => {
    if (permission?.roles) {
      setColumnVisibility((prev) => ({
        ...prev,
        select: canEditRows,
      }))
    }
  }, [permission?.roles, setColumnVisibility, canEditRows])

  const { rowDragDrop, mergeSheet } = useMergeDragDrop({
    config: vendorMergeConfig,
    enabled: canEditRows && canDelete(permission?.roles),
    getRowLabel: getVendorLabel,
    onMergeComplete: (mergedAwayId) => setSelectedItems((prev) => prev.filter((item) => item.id !== mergedAwayId)),
  })

  useQueryErrorNotification({ error, description: `Failed to load ${objectName.toLowerCase()}` })

  const { userMap, tokenMap, isLoading: fetchingUsers } = useAuthorMaps(userIds)

  const columns = useMemo(() => getColumns({ userMap, tokenMap, convertToReadOnly, selectedItems, setSelectedItems }), [userMap, tokenMap, convertToReadOnly, selectedItems, setSelectedItems])

  return (
    <>
      <DataTable<EntitiesNodeNonNull>
        columns={columns}
        sortFields={VENDORS_SORT_FIELDS}
        onSortChange={onSortChange}
        data={items}
        loading={fetching || fetchingUsers}
        sorting={orderBy}
        rowHref={(row) => `/registry/vendors/${row.id}`}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        paginationMeta={{
          totalCount: data?.entities.totalCount,
          pageInfo: data?.entities?.pageInfo,
          isLoading: isFetching,
        }}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        tableKey={tableKey}
        rowDragDrop={rowDragDrop}
      />
      {mergeSheet}
    </>
  )
}

TableComponent.displayName = 'VendorsTable'
export default TableComponent
