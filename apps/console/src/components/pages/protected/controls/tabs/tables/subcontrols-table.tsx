'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { canCreate, canEdit } from '@/lib/authz/utils'
import { CreateButton } from '@/components/shared/create-button/create-button'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { DataTable } from '@repo/ui/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { SearchFilterBar } from '@/components/pages/protected/controls/tabs/documentation-components/shared'
import type { FilterField, WhereCondition } from '@/types'
import { FileText } from 'lucide-react'
import { useDebounce } from '@uidotdev/usehooks'
import { extractFilterValues } from '@/components/pages/protected/controls/table-filter/extract-filter-values'

type Props = {
  subcontrols: ({
    node?: {
      refCode: string
      description?: string | null
      id: string
    } | null
  } | null)[]
}

type SubcontrolRow = {
  id: string
  refCode: string
  description?: string | null
}

const subcontrolsFilterFields: FilterField[] = [
  {
    key: 'hasDescription',
    label: 'Description',
    type: 'radio',
    icon: FileText,
    radioOptions: [
      { value: true, label: 'Has description' },
      { value: false, label: 'No description' },
    ],
  },
]

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
        .filter((edge): edge is { node: { id: string; refCode: string; description?: string | null } } => !!edge?.node && typeof edge.node.id === 'string' && typeof edge.node.refCode === 'string')
        .map(({ node }) => ({ id: node.id, refCode: node.refCode, description: node.description })),
    [subcontrols],
  )

  const normalizedSearch = debouncedSearch.trim().toLowerCase()
  const filterValues = useMemo(() => extractFilterValues(filters), [filters])
  const hasDescriptionFilter = typeof filterValues.hasDescription === 'boolean' ? (filterValues.hasDescription as boolean) : undefined

  const filteredSubcontrols = useMemo(() => {
    return cleanedSubcontrols.filter((row) => {
      if (hasDescriptionFilter === true && !row.description) return false
      if (hasDescriptionFilter === false && row.description) return false

      if (!normalizedSearch) return true

      const descriptionText = row.description ? row.description.replace(/<[^>]*>/g, '').toLowerCase() : ''
      return row.refCode.toLowerCase().includes(normalizedSearch) || descriptionText.includes(normalizedSearch)
    })
  }, [cleanedSubcontrols, hasDescriptionFilter, normalizedSearch])

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

  const columns = useMemo<ColumnDef<SubcontrolRow>[]>(
    () => [
      {
        accessorKey: 'refCode',
        header: () => <span className="whitespace-nowrap">Ref Code</span>,
        cell: ({ row }) => (
          <Link href={`/controls/${id}/${row.original.id}`} className="text-blue-500 hover:underline">
            {row.original.refCode}
          </Link>
        ),
      },
      {
        accessorKey: 'description',
        header: () => <span className="whitespace-nowrap">Description</span>,
        cell: ({ row }) => <span className="block max-w-[700px] truncate">{row.original.description ? convertToReadOnly(row.original.description, 0) : '-'}</span>,
      },
    ],
    [convertToReadOnly, id],
  )

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
