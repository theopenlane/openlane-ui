'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { canCreate, canEdit } from '@/lib/authz/utils'
import { CreateButton } from '@/components/shared/create-button/create-button'
import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { DataTable } from '@repo/ui/data-table'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { SearchFilterBar } from '@/components/pages/protected/controls/tabs/shared/documentation-shared'
import type { FilterField, WhereCondition } from '@/types'
import { useDebounce } from '@uidotdev/usehooks'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { getSubcontrolsColumns, getSubcontrolsFilterFields, type SubcontrolRow } from './subcontrols-table-config'
import { useGetSubcontrolsPaginated } from '@/lib/graphql-hooks/subcontrol'
import { SubcontrolControlSource, type SubcontrolWhereInput } from '@repo/codegen/src/schema'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'

const SubcontrolsTable: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { convertToReadOnly } = usePlateEditor()
  const { data: orgPermission } = useOrganizationRoles()
  const { data: permission } = useAccountRoles(ObjectTypes.CONTROL, id)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [filters, setFilters] = useState<WhereCondition>({})
  const [pagination, setPagination] = useState<TPagination>(DEFAULT_PAGINATION)
  const [filterFields, setFilterFields] = useState<FilterField[] | null>(null)
  const { enumOptions } = useGetCustomTypeEnums({
    where: {
      objectType: objectToSnakeCase(ObjectTypes.CONTROL),
      field: 'kind',
    },
  })

  const filterWhere = useMemo(() => {
    return whereGenerator<SubcontrolWhereInput>(filters as SubcontrolWhereInput, (key, value) => {
      return { [key]: value } as SubcontrolWhereInput
    })
  }, [filters])

  const where = useMemo<SubcontrolWhereInput>(() => {
    const searchText = debouncedSearch.trim()
    return {
      ...filterWhere,
      ...(id ? { controlID: id } : {}),
      ...(searchText ? { or: [{ refCodeContainsFold: searchText }, { descriptionContainsFold: searchText }] } : {}),
    }
  }, [id, filterWhere, debouncedSearch])

  const { subcontrols, paginationMeta, isLoading } = useGetSubcontrolsPaginated({
    where,
    pagination,
    enabled: Boolean(id),
  })

  const cleanedSubcontrols = useMemo<SubcontrolRow[]>(
    () =>
      subcontrols
        .filter((node): node is typeof node & { id: string; refCode: string } => !!node?.id && typeof node.refCode === 'string')
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

  const typeOptions = useMemo(() => enumOptions.map((option) => option.value).sort(), [enumOptions])
  const sourceOptions = useMemo(() => Object.values(SubcontrolControlSource).sort(), [])

  useEffect(() => {
    const fields = getSubcontrolsFilterFields(typeOptions, sourceOptions)
    setFilterFields((prev) => {
      const isSame = prev && JSON.stringify(prev) === JSON.stringify(fields)
      return isSame ? prev : fields
    })
  }, [sourceOptions, typeOptions])

  const handleFilterChange = useCallback((nextFilters: WhereCondition) => {
    setFilters(nextFilters)
  }, [])

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      page: 1,
      query: { first: prev.pageSize },
    }))
  }, [searchQuery, filters])

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
        filterFields={filterFields}
        onFilterChange={handleFilterChange}
      />

      <DataTable
        columns={columns}
        data={cleanedSubcontrols}
        loading={isLoading}
        pagination={pagination}
        onPaginationChange={setPagination}
        paginationMeta={paginationMeta}
        noResultsText="No subcontrols found."
        tableKey={undefined}
      />
    </div>
  )
}

export default SubcontrolsTable
