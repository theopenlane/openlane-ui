'use client'

import { useMemo } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { type ControlImplementationOrderField, type ControlImplementationWhereInput } from '@repo/codegen/src/schema'
import { type TTableProps } from '@/components/shared/crud-base/page'
import { getNodes } from '@/lib/graphql-hooks/connection'
import { type ControlImplementationListNode, useControlImplementationsWithFilter } from '@/lib/graphql-hooks/control-implementation'
import { useAuthorMaps } from '@/lib/graphql-hooks/authors'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { getControlImplementationTitle, sortByRefCode } from '@/utils/control-implementation'
import { getColumns } from './columns'
import { CONTROL_IMPLEMENTATION_SORT_FIELDS } from './table-config'
import { type ControlImplementationRow, displayNamePlural, tableKey } from './types'

const TableComponent = ({
  onSortChange,
  pagination,
  onPaginationChange,
  whereFilter,
  orderByFilter,
  columnVisibility,
  setColumnVisibility,
  selectedItems,
  setSelectedItems,
  rowHref,
}: TTableProps<ControlImplementationWhereInput>) => {
  const orderBy = useMemo(() => orderByFilter?.map(({ field, direction }) => ({ field: field as ControlImplementationOrderField, direction })), [orderByFilter])

  const { data, isPending, isFetching, error } = useControlImplementationsWithFilter({ where: whereFilter, orderBy, pagination })

  useQueryErrorNotification({ error, description: `Failed to load ${displayNamePlural.toLowerCase()}` })

  const rows = useMemo(
    () =>
      getNodes<ControlImplementationListNode>(data?.controlImplementations).map<ControlImplementationRow>((node) => ({
        ...node,
        title: getControlImplementationTitle(node),
        controlEdges: sortByRefCode(node.controls),
        subcontrolEdges: sortByRefCode(node.subcontrols),
      })),
    [data?.controlImplementations],
  )

  const { userMap, tokenMap, isLoading: fetchingUsers } = useAuthorMaps(rows.flatMap(({ createdBy, updatedBy }) => [createdBy, updatedBy]))

  const columns = useMemo(() => getColumns({ userMap, tokenMap, selectedItems, setSelectedItems }), [userMap, tokenMap, selectedItems, setSelectedItems])

  return (
    <DataTable<ControlImplementationRow>
      columns={columns}
      sortFields={CONTROL_IMPLEMENTATION_SORT_FIELDS}
      onSortChange={onSortChange}
      data={rows}
      loading={isPending || fetchingUsers}
      sorting={orderBy}
      rowHref={rowHref}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      paginationMeta={{
        totalCount: data?.controlImplementations.totalCount,
        pageInfo: data?.controlImplementations.pageInfo,
        isLoading: isFetching,
      }}
      columnVisibility={columnVisibility}
      setColumnVisibility={setColumnVisibility}
      tableKey={tableKey}
    />
  )
}

TableComponent.displayName = 'ControlImplementationsTable'
export default TableComponent
