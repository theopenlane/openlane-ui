'use client'

import { DataTable } from '@repo/ui/data-table'
import React, { useEffect, useMemo } from 'react'
import { type ReviewWhereInput, type Review, type ReviewOrderField } from '@repo/codegen/src/schema'
import { getColumns } from '@/components/pages/protected/reviews/table/columns.tsx'
import { type ReviewsNodeNonNull, useReviewsWithFilter } from '@/lib/graphql-hooks/review'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { useNotification } from '@/hooks/useNotification'
import { REVIEWS_SORT_FIELDS } from './table-config'
import { type TTableProps } from '@/components/shared/crud-base/page'
import { objectName, tableKey } from './types'
import { isUlid } from '@/lib/validators'
import { useSession } from 'next-auth/react'

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
  rowHref,
}: TTableProps<ReviewWhereInput>) => {
  const { replace } = useSmartRouter()
  const { data: session } = useSession()

  const orderBy = useMemo(() => {
    if (!orderByFilter) return undefined
    return orderByFilter.map(({ field, direction }) => ({
      field: field as ReviewOrderField,
      direction,
    }))
  }, [orderByFilter])

  const {
    reviewsNodes: items,
    isLoading: fetching,
    data,
    isFetching,
    isError,
  } = useReviewsWithFilter({
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
        select: canEdit(permission.roles, session),
      }))
    }
  }, [permission?.roles, setColumnVisibility, canEdit, session])

  useEffect(() => {
    if (isError) {
      errorNotification({
        title: 'Error',
        description: `Failed to load ${objectName.toLowerCase()}`,
      })
    }
  }, [isError, errorNotification])

  const { userMap, tokenMap, isLoading: fetchingUsers } = useAuthorMaps(userIds)

  const columns = useMemo(() => getColumns({ userMap, tokenMap, convertToReadOnly, selectedItems, setSelectedItems }), [userMap, tokenMap, convertToReadOnly, selectedItems, setSelectedItems])

  return (
    <DataTable<ReviewsNodeNonNull, Review>
      columns={columns}
      sortFields={REVIEWS_SORT_FIELDS}
      onSortChange={onSortChange}
      data={items}
      loading={fetching || fetchingUsers}
      sorting={orderBy}
      onRowClick={(item) => {
        replace({ id: item.id })
      }}
      rowHref={rowHref}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      paginationMeta={{
        totalCount: data?.reviews.totalCount,
        pageInfo: data?.reviews?.pageInfo,
        isLoading: isFetching,
      }}
      columnVisibility={columnVisibility}
      setColumnVisibility={setColumnVisibility}
      tableKey={tableKey}
    />
  )
}

TableComponent.displayName = 'ReviewsTable'
export default TableComponent
