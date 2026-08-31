'use client'

import React from 'react'
import { type ColumnDef } from '@repo/ui/table-types'
import { DataTable } from '@repo/ui/data-table'
import { Input } from '@repo/ui/input'
import { LoaderCircle, SearchIcon } from 'lucide-react'
import { TableFilter } from '@/components/shared/table-filter/table-filter'
import type { TPagination, TPaginationMeta } from '@repo/ui/pagination-types'
import type { FilterField, WhereCondition } from '@/types'

export { mergeWhere } from '@/lib/merge-where'

export type AssociationRow = {
  id: string
  name: string
  status?: string | null
  approver?: { displayName?: string | null } | null
  updatedBy?: string | null
  updatedAt?: string | null
  href: string
}

type SearchFilterBarProps = {
  placeholder: string
  isSearching: boolean
  searchValue: string
  onSearchChange: (value: string) => void
  filterFields: FilterField[] | null
  onFilterChange: (filters: WhereCondition) => void
  actionButtons?: React.ReactNode
}

export const SearchFilterBar = ({ placeholder, isSearching, searchValue, onSearchChange, filterFields, onFilterChange, actionButtons }: SearchFilterBarProps) => (
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
    <div className="flex items-center justify-end gap-2">
      {filterFields && <TableFilter filterFields={filterFields} onFilterChange={onFilterChange} />}
      {actionButtons}
    </div>
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
  onRowClick?: (row: AssociationRow) => void
}

export const AssociationSection = ({ title, rows, columns, loading, pagination, onPaginationChange, paginationMeta, searchBar, onRowClick }: AssociationSectionProps) => (
  <div>
    <h3 className="text-base font-semibold mb-2">{title}</h3>
    <div className="mb-3">{searchBar}</div>
    <DataTable
      columns={columns}
      data={rows}
      loading={loading}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      paginationMeta={paginationMeta}
      tableKey={undefined}
      onRowClick={onRowClick}
    />
  </div>
)
