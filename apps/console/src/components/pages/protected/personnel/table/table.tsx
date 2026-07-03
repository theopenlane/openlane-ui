'use client'

import { DataTable } from '@repo/ui/data-table'
import React, { useEffect, useMemo } from 'react'
import { type IdentityHolderWhereInput, type IdentityHolder, type IdentityHolderOrderField } from '@repo/codegen/src/schema'
import { type IdentityHoldersNodeNonNull, useIdentityHoldersWithFilter } from '@/lib/graphql-hooks/identity-holder'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { useNotification } from '@/hooks/useNotification'
import { PERSONNEL_SORT_FIELDS } from './table-config'
import { getColumns } from './columns'
import { type TTableProps } from '@/components/shared/crud-base/page'
import { objectName, tableKey } from './types'
import { isUlid } from '@/lib/validators'
import { useRouter } from 'next/navigation'
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
}: TTableProps<IdentityHolderWhereInput>) => {
  const { push } = useRouter()
  const { data: session } = useSession()

  const orderBy = useMemo(() => {
    if (!orderByFilter) return undefined
    return orderByFilter.map(({ field, direction }) => ({
      field: field as IdentityHolderOrderField,
      direction,
    }))
  }, [orderByFilter])

  const {
    identityHoldersNodes: items,
    isLoading: fetching,
    data,
    isFetching,
    isError,
  } = useIdentityHoldersWithFilter({
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
      if (item.internalOwnerUser?.id) ids.add(item.internalOwnerUser.id)
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

  const columns = useMemo(() => getColumns({ userMap, tokenMap, selectedItems, setSelectedItems }), [userMap, tokenMap, selectedItems, setSelectedItems])

  return (
    <DataTable<IdentityHoldersNodeNonNull, IdentityHolder>
      columns={columns}
      sortFields={PERSONNEL_SORT_FIELDS}
      onSortChange={onSortChange}
      data={items}
      loading={fetching || fetchingUsers}
      sorting={orderBy}
      onRowClick={(item) => {
        push(`/registry/personnel/${item.id}`)
      }}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      paginationMeta={{
        totalCount: data?.identityHolders?.totalCount,
        pageInfo: data?.identityHolders?.pageInfo,
        isLoading: isFetching,
      }}
      columnVisibility={columnVisibility}
      setColumnVisibility={setColumnVisibility}
      tableKey={tableKey}
    />
  )
}

TableComponent.displayName = 'PersonnelTable'
export default TableComponent
