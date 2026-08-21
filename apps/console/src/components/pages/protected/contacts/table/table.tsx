'use client'

import { DataTable } from '@repo/ui/data-table'
import { useEffect, useMemo } from 'react'
import { type ContactWhereInput, type Contact, type ContactOrderField } from '@repo/codegen/src/schema'
import { type ContactsNodeNonNull, useContactsWithFilter } from '@/lib/graphql-hooks/contact'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { CONTACTS_SORT_FIELDS } from './table-config'
import { getColumns } from './columns'
import { type TTableProps } from '@/components/shared/crud-base/page'
import { objectName, tableKey } from './types'
import { isUlid } from '@/lib/validators'
import { useSession } from 'next-auth/react'
import { canDelete } from '@/lib/authz/utils'
import { useMergeDragDrop } from '@/components/shared/merge-records/use-merge-drag-drop'
import { contactMergeConfig, getContactLabel } from '@/components/shared/merge-records/configs/contact-merge-config'

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
}: TTableProps<ContactWhereInput>) => {
  const { replace } = useSmartRouter()

  const orderBy = useMemo(() => {
    if (!orderByFilter) return undefined
    return orderByFilter.map(({ field, direction }) => ({
      field: field as ContactOrderField,
      direction,
    }))
  }, [orderByFilter])

  const {
    contactsNodes: items,
    isLoading: fetching,
    data,
    isFetching,
    error,
  } = useContactsWithFilter({
    where: whereFilter,
    orderBy: orderBy,
    pagination,
    enabled: true,
  })

  const { data: session } = useSession()
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
    config: contactMergeConfig,
    enabled: canEditRows && canDelete(permission?.roles),
    getRowLabel: getContactLabel,
    onMergeComplete: (mergedAwayId) => setSelectedItems((prev) => prev.filter((item) => item.id !== mergedAwayId)),
  })

  useQueryErrorNotification({ error, description: `Failed to load ${objectName.toLowerCase()}` })

  const { userMap, tokenMap, isLoading: fetchingUsers } = useAuthorMaps(userIds)

  const columns = useMemo(() => getColumns({ userMap, tokenMap, selectedItems, setSelectedItems }), [userMap, tokenMap, selectedItems, setSelectedItems])

  return (
    <>
      <DataTable<ContactsNodeNonNull, Contact>
        columns={columns}
        sortFields={CONTACTS_SORT_FIELDS}
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
          totalCount: data?.contacts?.totalCount,
          pageInfo: data?.contacts?.pageInfo,
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

TableComponent.displayName = 'ContactsTable'
export default TableComponent
