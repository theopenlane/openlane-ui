import React, { useEffect, useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { DataTable } from '@repo/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { SearchFilterBar } from '@/components/shared/crud-base/tabs/shared'
import type { FilterField, WhereCondition } from '@/types'
import { extractFilterValues } from '@/components/pages/protected/controls/table-filter/extract-filter-values'
import { useDebounce } from '@uidotdev/usehooks'
import { getMappedControlsFilterFields } from './mapped-controls-config'
import type { MappedControlRow } from './mapped-controls-types'
import { Card } from '@repo/ui/cardpanel'

type MappedControlsTableProps = {
  title: string
  rows: MappedControlRow[]
  columns: ColumnDef<MappedControlRow>[]
  searchPlaceholder: string
  showFrameworkFilter?: boolean
  action?: React.ReactNode
  countLabel?: string
  implementedCount?: number
}

const MappedControlsTable: React.FC<MappedControlsTableProps> = ({ title, rows, columns, searchPlaceholder, showFrameworkFilter = false, action, countLabel, implementedCount }) => {
  const [open, setOpen] = useState(true)
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
  }, [rows, typeFilter, controlSourceFilter, categoryFilter, subcategoryFilter, frameworkFilter, showFrameworkFilter, normalizedSearch])

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
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{title}</h2>
            {countLabel && <span className="text-sm text-muted-foreground">{countLabel}</span>}
          </div>
          <div className="flex items-center gap-3">
            {implementedCount !== undefined && rows.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.round((implementedCount / rows.length) * 100)}%` }} />
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {implementedCount} of {rows.length} implemented
                </span>
              </div>
            )}
            <CollapsibleTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label={open ? 'Collapse' : 'Expand'}>
                <ChevronDown size={18} className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
              </button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SearchFilterBar
                  placeholder={searchPlaceholder}
                  isSearching={searchQuery !== debouncedSearch}
                  searchValue={searchQuery}
                  onSearchChange={setSearchQuery}
                  filterFields={filterFields}
                  onFilterChange={setFilters}
                />
              </div>
              {action}
            </div>

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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

export default MappedControlsTable
