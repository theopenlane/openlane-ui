import React, { useEffect, useMemo, useState } from 'react'
import { DataTable } from '@repo/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { SearchFilterBar } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import type { FilterField, WhereCondition } from '@/types'
import { extractFilterValues } from '@/components/pages/protected/controls/table-filter/extract-filter-values'
import { useDebounce } from '@uidotdev/usehooks'
import { getMappedControlsFilterFields } from './mapped-controls-config'
import type { MappedControlRow } from './mapped-controls-types'

type MappedControlsTableProps = {
  title: string
  rows: MappedControlRow[]
  columns: ColumnDef<MappedControlRow>[]
  searchPlaceholder: string
  showFrameworkFilter?: boolean
  action?: React.ReactNode
}

type MappingTypeFilter = 'all' | MappedControlRow['mappingType']
type MappingSourceFilter = 'all' | MappedControlRow['source']

const MappedControlsTable: React.FC<MappedControlsTableProps> = ({ title, rows, columns, searchPlaceholder, showFrameworkFilter = false, action }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [filters, setFilters] = useState<WhereCondition>({})
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const normalizedSearch = debouncedSearch.trim().toLowerCase()

  const filterFields = useMemo<FilterField[]>(() => getMappedControlsFilterFields(rows, showFrameworkFilter), [rows, showFrameworkFilter])
  const filterValues = useMemo(() => extractFilterValues(filters), [filters])
  const typeFilter = useMemo(() => (filterValues.typeIn ?? []) as string[] | string, [filterValues.typeIn])
  const controlSourceFilter = useMemo(() => (filterValues.sourceIn ?? []) as string[] | string, [filterValues.sourceIn])
  const categoryFilter = useMemo(() => (filterValues.categoryContainsFold ?? '') as string, [filterValues.categoryContainsFold])
  const subcategoryFilter = useMemo(() => (filterValues.subcategoryContainsFold ?? '') as string, [filterValues.subcategoryContainsFold])
  const mappingTypeFilter = useMemo(() => (filterValues.mappingTypeIn ?? []) as MappingTypeFilter[] | MappingTypeFilter, [filterValues.mappingTypeIn])
  const mappingSourceFilter = useMemo(() => (filterValues.mappingSourceIn ?? []) as MappingSourceFilter[] | MappingSourceFilter, [filterValues.mappingSourceIn])
  const frameworkFilter = useMemo(() => (filterValues.referenceFrameworkIn ?? []) as string[] | string, [filterValues.referenceFrameworkIn])

  const filteredRows = useMemo(() => {
    const normalizedCategory = categoryFilter.trim().toLowerCase()
    const normalizedSubcategory = subcategoryFilter.trim().toLowerCase()

    return rows.filter((row) => {
      if (Array.isArray(typeFilter) && typeFilter.length > 0 && !typeFilter.includes(row.type ?? '')) return false
      if (!Array.isArray(typeFilter) && typeFilter !== 'all' && row.type !== typeFilter) return false

      if (Array.isArray(controlSourceFilter) && controlSourceFilter.length > 0 && !controlSourceFilter.includes(row.controlSource ?? '')) return false
      if (!Array.isArray(controlSourceFilter) && controlSourceFilter !== 'all' && row.controlSource !== controlSourceFilter) return false

      if (normalizedCategory && !(row.category ?? '').toLowerCase().includes(normalizedCategory)) return false

      if (normalizedSubcategory && !(row.subcategory ?? '').toLowerCase().includes(normalizedSubcategory)) return false

      if (Array.isArray(mappingTypeFilter) && mappingTypeFilter.length > 0 && !mappingTypeFilter.includes(row.mappingType)) return false
      if (!Array.isArray(mappingTypeFilter) && mappingTypeFilter !== 'all' && row.mappingType !== mappingTypeFilter) return false

      if (Array.isArray(mappingSourceFilter) && mappingSourceFilter.length > 0 && !mappingSourceFilter.includes(row.source)) return false
      if (!Array.isArray(mappingSourceFilter) && mappingSourceFilter !== 'all' && row.source !== mappingSourceFilter) return false

      if (showFrameworkFilter) {
        if (Array.isArray(frameworkFilter) && frameworkFilter.length > 0 && !frameworkFilter.includes(row.referenceFramework ?? '')) return false
        if (!Array.isArray(frameworkFilter) && frameworkFilter !== 'all' && row.referenceFramework !== frameworkFilter) return false
      }

      if (!normalizedSearch) return true

      return (
        row.refCode.toLowerCase().includes(normalizedSearch) ||
        (row.description ?? '').toLowerCase().includes(normalizedSearch) ||
        (row.type ?? '').toLowerCase().includes(normalizedSearch) ||
        (row.controlSource ?? '').toLowerCase().includes(normalizedSearch) ||
        (row.category ?? '').toLowerCase().includes(normalizedSearch) ||
        (row.subcategory ?? '').toLowerCase().includes(normalizedSearch) ||
        (row.referenceFramework ?? '').toLowerCase().includes(normalizedSearch)
      )
    })
  }, [rows, typeFilter, controlSourceFilter, categoryFilter, subcategoryFilter, mappingTypeFilter, mappingSourceFilter, frameworkFilter, showFrameworkFilter, normalizedSearch])

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
      query: { first: prev.pageSize },
    }))
  }, [searchQuery, filters])

  const pagedRows = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return filteredRows.slice(start, start + pagination.pageSize)
  }, [filteredRows, pagination.page, pagination.pageSize])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {action}
      </div>

      <SearchFilterBar
        placeholder={searchPlaceholder}
        isSearching={searchQuery !== debouncedSearch}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterFields={filterFields}
        onFilterChange={setFilters}
      />

      <DataTable
        columns={columns}
        data={pagedRows}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={{ totalCount: filteredRows.length }}
        noResultsText="No mapped controls found."
        tableKey={undefined}
      />
    </div>
  )
}

export default MappedControlsTable
