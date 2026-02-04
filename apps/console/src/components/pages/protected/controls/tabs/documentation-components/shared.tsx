'use client'

import React from 'react'
import Link from 'next/link'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@repo/ui/data-table'
import { Input } from '@repo/ui/input'
import { LoaderCircle, SearchIcon } from 'lucide-react'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import type { TableFilterKeysEnum } from '@/components/shared/table-filter/table-filter-keys'
import type { TPagination, TPaginationMeta } from '@repo/ui/pagination-types'
import { formatTimeSince } from '@/utils/date'
import type { FilterField, WhereCondition } from '@/types'

export type AssociationRow = {
  id: string
  name: string
  updatedAt?: string | null
  href: string
}

export const buildAssociationFilter = (controlId?: string, subcontrolIds: string[] = []) => {
  if (controlId && subcontrolIds.length > 0) {
    return {
      or: [{ hasControlsWith: [{ id: controlId }] }, { hasSubcontrolsWith: [{ idIn: subcontrolIds }] }],
    }
  }

  if (controlId) {
    return { hasControlsWith: [{ id: controlId }] }
  }

  if (subcontrolIds.length > 0) {
    return { hasSubcontrolsWith: [{ idIn: subcontrolIds }] }
  }

  return {}
}

const isEmptyCondition = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return true
  return Object.keys(value as Record<string, unknown>).length === 0
}

export const mergeWhere = <T extends { and?: T[] | null | undefined }>(conditions: Array<T | null | undefined>): T => {
  const valid = conditions.filter((condition) => condition && !isEmptyCondition(condition)) as T[]
  if (valid.length === 0) return {} as T
  if (valid.length === 1) return valid[0]
  return { and: valid } as T
}

export const getBaseColumns = (): ColumnDef<AssociationRow>[] => [
  {
    accessorKey: 'name',
    header: () => <span className="whitespace-nowrap">Name</span>,
    cell: ({ row }) => (
      <Link href={row.original.href} className="text-blue-500 hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'updatedAt',
    header: () => <span className="whitespace-nowrap">Last Updated</span>,
    cell: ({ row }) => <span className="whitespace-nowrap">{formatTimeSince(row.original.updatedAt)}</span>,
    size: 140,
  },
]

type SearchFilterBarProps = {
  placeholder: string
  isSearching: boolean
  searchValue: string
  onSearchChange: (value: string) => void
  filterFields?: FilterField[] | null
  filterKey?: TableFilterKeysEnum
  onFilterChange?: (filters: WhereCondition) => void
}

export const SearchFilterBar = ({ placeholder, isSearching, searchValue, onSearchChange, filterFields, filterKey, onFilterChange }: SearchFilterBarProps) => (
  <div className="flex items-center justify-between gap-2 w-full">
    <div className="flex items-center gap-2 flex-1">
      <Input
        icon={isSearching ? <LoaderCircle className="animate-spin" size={16} /> : <SearchIcon size={16} />}
        placeholder={placeholder}
        value={searchValue}
        onChange={(event) => onSearchChange(event.currentTarget.value)}
        variant="searchTable"
        className="w-full max-w-[320px]"
      />
    </div>
    {filterFields && onFilterChange && (
      <div className="flex items-center justify-end">
        <TableFilter filterFields={filterFields} pageKey={filterKey} onFilterChange={onFilterChange} />
      </div>
    )}
  </div>
)

type AssociationSectionProps = {
  title: string
  rows: AssociationRow[]
  columns: ColumnDef<AssociationRow>[]
  loading: boolean
  pagination: TPagination
  onPaginationChange: (pagination: TPagination) => void
  paginationMeta: TPaginationMeta
  searchBar: React.ReactNode
}

export const AssociationSection = ({ title, rows, columns, loading, pagination, onPaginationChange, paginationMeta, searchBar }: AssociationSectionProps) => (
  <div>
    <h3 className="text-base font-semibold mb-2">{title}</h3>
    <div className="mb-3">{searchBar}</div>
    <DataTable columns={columns} data={rows} loading={loading} pagination={pagination} onPaginationChange={onPaginationChange} paginationMeta={paginationMeta} tableKey={undefined} />
  </div>
)
