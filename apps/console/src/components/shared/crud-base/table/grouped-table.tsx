'use client'

import React, { useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import { type ColumnDef } from '@repo/ui/table-types'
import { type TPagination, type TPaginationMeta } from '@repo/ui/pagination-types'
import { GroupByOrderField, OrderDirection, type GroupByOrder } from '@repo/codegen/src/schema'
import { ExpandRowButton } from '@/components/shared/crud-base/columns/expand-row-button'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { type TTableProps } from '@/components/shared/crud-base/page'
import { type TGroupByOption } from './group-by-select'

export type TGroupKey = string | null

export type TGroupBucket = { key?: TGroupKey; count: number }

export type TUseGroupsArgs<TWhereInput> = {
  where: TWhereInput | null
  orderBy: GroupByOrder
  pagination: TPagination
}

export type TUseGroupsResult = {
  buckets: TGroupBucket[]
  paginationMeta: TPaginationMeta
  isLoading: boolean
  error: unknown
}

export type TGroupByDefinition<TWhereInput> = TGroupByOption & {
  emptyKeyLabel: string
  membersWhere: (where: TWhereInput | null, key: TGroupKey) => TWhereInput
  memberColumnVisibility?: Record<string, boolean>
  useGroups: (args: TUseGroupsArgs<TWhereInput>) => TUseGroupsResult
}

export type TGroupByConfig<TWhereInput> = {
  options: TGroupByDefinition<TWhereInput>[]
  countLabel: string
}

type TGroupOrder = Required<GroupByOrder>

const NULL_KEY_ROW_ID = '__no_value__'

const BLANK_KEY_LABEL = '(blank)'

const DEFAULT_GROUP_ORDER: TGroupOrder = { field: GroupByOrderField.COUNT, direction: OrderDirection.DESC }

const SORT_KEY_BY_FIELD: Record<GroupByOrderField, string> = { [GroupByOrderField.KEY]: 'key', [GroupByOrderField.COUNT]: 'count' }

const FIELD_BY_SORT_KEY: Partial<Record<string, GroupByOrderField>> = { key: GroupByOrderField.KEY, count: GroupByOrderField.COUNT }

const groupKeyLabel = (key: TGroupKey | undefined, emptyKeyLabel: string): string => (key == null ? emptyKeyLabel : key.trim() || BLANK_KEY_LABEL)

const nextGroupOrder = (current: TGroupOrder, conditions: { field: string; direction?: OrderDirection }[]): TGroupOrder => {
  const [condition] = conditions
  const field = condition ? FIELD_BY_SORT_KEY[condition.field] : undefined
  if (field) return { field, direction: condition.direction ?? OrderDirection.ASC }
  if (current.field === DEFAULT_GROUP_ORDER.field && current.direction === DEFAULT_GROUP_ORDER.direction) return { ...DEFAULT_GROUP_ORDER, direction: OrderDirection.ASC }
  return DEFAULT_GROUP_ORDER
}

type TGroupMembersProps<TWhereInput> = TTableProps<TWhereInput> & {
  TableComponent: React.ComponentType<TTableProps<TWhereInput>>
}

const GroupMembers = <TWhereInput,>({ TableComponent, ...tableProps }: TGroupMembersProps<TWhereInput>) => {
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  return (
    <div className="border-t bg-background px-4 py-3">
      <TableComponent {...tableProps} pagination={pagination} onPaginationChange={setPagination} />
    </div>
  )
}

type TGroupedTableProps<TWhereInput> = TTableProps<TWhereInput> & {
  definition: TGroupByDefinition<TWhereInput>
  countLabel: string
  TableComponent: React.ComponentType<TTableProps<TWhereInput>>
}

export const GroupedTable = <TWhereInput,>({ definition, countLabel, TableComponent, ...tableProps }: TGroupedTableProps<TWhereInput>) => {
  const { whereFilter, pagination, onPaginationChange, columnVisibility } = tableProps
  const [groupOrder, setGroupOrder] = useState<TGroupOrder>(DEFAULT_GROUP_ORDER)

  const { buckets, paginationMeta, isLoading, error } = definition.useGroups({ where: whereFilter, orderBy: groupOrder, pagination })
  useQueryErrorNotification({ error, description: `Failed to load groups by ${definition.label}` })

  const memberColumnVisibility = useMemo(() => ({ ...columnVisibility, ...definition.memberColumnVisibility }), [columnVisibility, definition.memberColumnVisibility])

  const columns = useMemo<ColumnDef<TGroupBucket>[]>(
    () => [
      {
        id: 'expand',
        header: '',
        size: 48,
        enableResizing: false,
        cell: ({ row }) => <ExpandRowButton row={row} label={groupKeyLabel(row.original.key, definition.emptyKeyLabel)} />,
      },
      {
        accessorKey: 'key',
        header: definition.label,
        size: 320,
        cell: ({ row }) => {
          const { key } = row.original
          return key?.trim() ? key : <span className="italic text-muted-foreground">{groupKeyLabel(key, definition.emptyKeyLabel)}</span>
        },
      },
      { accessorKey: 'count', header: countLabel, size: 140 },
    ],
    [definition.emptyKeyLabel, definition.label, countLabel],
  )

  return (
    <DataTable<TGroupBucket>
      columns={columns}
      data={buckets}
      loading={isLoading}
      sortFields={[
        { key: 'key', label: definition.label },
        { key: 'count', label: countLabel },
      ]}
      sorting={[{ field: SORT_KEY_BY_FIELD[groupOrder.field], direction: groupOrder.direction }]}
      onSortChange={(conditions: { field: string; direction?: OrderDirection }[]) => {
        setGroupOrder((current) => nextGroupOrder(current, conditions))
        onPaginationChange({ ...pagination, page: 1, query: { first: pagination.pageSize } })
      }}
      getRowId={(bucket) => bucket.key ?? NULL_KEY_ROW_ID}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      paginationMeta={paginationMeta}
      noResultsText="No results"
      tableKey={undefined}
      renderExpandedRow={(row) => (
        <GroupMembers<TWhereInput>
          {...tableProps}
          TableComponent={TableComponent}
          whereFilter={definition.membersWhere(whereFilter, row.original.key ?? null)}
          columnVisibility={memberColumnVisibility}
        />
      )}
    />
  )
}
