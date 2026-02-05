'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { canCreate, canEdit } from '@/lib/authz/utils'
import { CreateButton } from '@/components/shared/create-button/create-button'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { DataTable } from '@repo/ui/data-table'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { SearchFilterBar } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import type { FilterField, WhereCondition } from '@/types'
import { useDebounce } from '@uidotdev/usehooks'
import { extractFilterValues } from '@/components/pages/protected/controls/table-filter/extract-filter-values'
import { getSubcontrolsColumns, getSubcontrolsFilterFields, type SubcontrolRow } from './subcontrols-table-config'
import type { SubcontrolsPaginatedNode } from './types'

type Props = {
  subcontrols: SubcontrolsPaginatedNode[]
}

const SubcontrolsTable: React.FC<Props> = ({ subcontrols }) => {
  const { id } = useParams<{ id: string }>()
  const { convertToReadOnly } = usePlateEditor()
  const { data: orgPermission } = useOrganizationRoles()
  const { data: permission } = useAccountRoles(ObjectEnum.CONTROL, id)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [filters, setFilters] = useState<WhereCondition>({})
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)

  const cleanedSubcontrols = useMemo<SubcontrolRow[]>(
    () =>
      subcontrols
        .filter((node): node is SubcontrolsPaginatedNode => !!node?.id && typeof node.refCode === 'string')
        .map((node) => ({
          id: node.id,
          refCode: node.refCode,
          description: node.description,
          status: node.status,
          type: node.subcontrolKindName,
          source: node.source,
          category: node.category,
          subcategory: node.subcategory,
        })),
    [subcontrols],
  )

  const normalizedSearch = debouncedSearch.trim().toLowerCase()
  const filterValues = useMemo(() => extractFilterValues(filters), [filters])
  const typeFilter = useMemo(() => (filterValues.typeIn ?? []) as string[] | string, [filterValues.typeIn])
  const sourceFilter = useMemo(() => (filterValues.sourceIn ?? []) as string[] | string, [filterValues.sourceIn])
  const categoryFilter = useMemo(() => (filterValues.categoryContainsFold ?? '') as string, [filterValues.categoryContainsFold])
  const subcategoryFilter = useMemo(() => (filterValues.subcategoryContainsFold ?? '') as string, [filterValues.subcategoryContainsFold])

  const typeOptions = useMemo(() => {
    const options = new Set<string>()
    cleanedSubcontrols.forEach((row) => {
      if (row.type) options.add(row.type)
    })
    return Array.from(options).sort()
  }, [cleanedSubcontrols])

  const sourceOptions = useMemo(() => {
    const options = new Set<string>()
    cleanedSubcontrols.forEach((row) => {
      if (row.source) options.add(row.source)
    })
    return Array.from(options).sort()
  }, [cleanedSubcontrols])

  const subcontrolsFilterFields = useMemo<FilterField[]>(() => getSubcontrolsFilterFields(typeOptions, sourceOptions), [sourceOptions, typeOptions])

  const filteredSubcontrols = useMemo(() => {
    const normalizedCategory = categoryFilter.trim().toLowerCase()
    const normalizedSubcategory = subcategoryFilter.trim().toLowerCase()

    return cleanedSubcontrols.filter((row) => {
      if (Array.isArray(typeFilter) && typeFilter.length > 0 && !typeFilter.includes(row.type ?? '')) return false
      if (!Array.isArray(typeFilter) && typeFilter !== 'all' && row.type !== typeFilter) return false

      if (Array.isArray(sourceFilter) && sourceFilter.length > 0 && !sourceFilter.includes(row.source ?? '')) return false
      if (!Array.isArray(sourceFilter) && sourceFilter !== 'all' && row.source !== sourceFilter) return false

      if (normalizedCategory && !(row.category ?? '').toLowerCase().includes(normalizedCategory)) return false

      if (normalizedSubcategory && !(row.subcategory ?? '').toLowerCase().includes(normalizedSubcategory)) return false

      if (!normalizedSearch) return true

      const descriptionText = row.description ? row.description.replace(/<[^>]*>/g, '').toLowerCase() : ''
      return (
        row.refCode.toLowerCase().includes(normalizedSearch) ||
        descriptionText.includes(normalizedSearch) ||
        (row.type ?? '').toLowerCase().includes(normalizedSearch) ||
        (row.source ?? '').toLowerCase().includes(normalizedSearch) ||
        (row.category ?? '').toLowerCase().includes(normalizedSearch) ||
        (row.subcategory ?? '').toLowerCase().includes(normalizedSearch)
      )
    })
  }, [cleanedSubcontrols, typeFilter, sourceFilter, categoryFilter, subcategoryFilter, normalizedSearch])

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
      query: { first: prev.pageSize },
    }))
  }, [searchQuery, filters])

  const pagedSubcontrols = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    return filteredSubcontrols.slice(start, start + pagination.pageSize)
  }, [filteredSubcontrols, pagination.page, pagination.pageSize])

  const columns = useMemo(() => getSubcontrolsColumns(id, convertToReadOnly), [convertToReadOnly, id])

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-semibold">Subcontrols</h2>
          {canCreate(orgPermission?.roles, AccessEnum.CanCreateSubcontrol) || (canEdit(permission?.roles) && <CreateButton type="subcontrol" href={`/controls/${id}/create-subcontrol`} />)}
        </div>
      </div>

      <SearchFilterBar
        placeholder="Search subcontrols"
        isSearching={searchQuery !== debouncedSearch}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filterFields={subcontrolsFilterFields}
        onFilterChange={setFilters}
      />

      <DataTable
        columns={columns}
        data={pagedSubcontrols}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={{ totalCount: filteredSubcontrols.length }}
        noResultsText="No subcontrols found."
        tableKey={undefined}
      />
    </div>
  )
}

export default SubcontrolsTable
