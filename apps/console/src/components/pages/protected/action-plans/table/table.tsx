'use client'

import React, { useEffect, useMemo } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { type ActionPlanWhereInput, type ActionPlanOrderField } from '@repo/codegen/src/schema'
import { getColumns } from './columns'
import { useActionPlansWithFilter } from '@/lib/graphql-hooks/action-plan'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { ACTION_PLANS_SORT_FIELDS } from './table-config'
import { tableKey as defaultTableKey } from './types'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { type TTableProps } from '@/components/shared/crud-base/page'
import { objectName } from './types'
import { useNotification } from '@/hooks/useNotification'
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
  defaultSorting,
}: TTableProps<ActionPlanWhereInput>) => {
  const { replace } = useSmartRouter()
  const { data: session } = useSession()

  const orderBy = useMemo(() => {
    if (!orderByFilter) return undefined
    return orderByFilter.map(({ field, direction }) => ({
      field: field as ActionPlanOrderField,
      direction,
    }))
  }, [orderByFilter])

  const {
    actionPlansNodes: items,
    isLoading: fetching,
    data,
    isFetching,
    isError,
  } = useActionPlansWithFilter({
    where: whereFilter ?? undefined,
    orderBy,
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

  const hasItems = useMemo(() => items && items.length > 0, [items])

  useEffect(() => {
    onHasChange?.(!!hasItems)
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

  const columns = useMemo(() => getColumns({ userMap, tokenMap, selectedItems, setSelectedItems }), [userMap, tokenMap, selectedItems, setSelectedItems])

  return (
    <DataTable
      columns={columns}
      sortFields={ACTION_PLANS_SORT_FIELDS}
      onSortChange={onSortChange}
      data={items ?? []}
      loading={fetching || fetchingUsers}
      defaultSorting={defaultSorting}
      onRowClick={(item) => replace({ id: item.id })}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      paginationMeta={{
        totalCount: data?.actionPlans?.totalCount,
        pageInfo: data?.actionPlans?.pageInfo,
        isLoading: isFetching,
      }}
      columnVisibility={columnVisibility}
      setColumnVisibility={setColumnVisibility}
      tableKey={defaultTableKey}
    />
  )
}

TableComponent.displayName = 'ActionPlansTable'
export default TableComponent
