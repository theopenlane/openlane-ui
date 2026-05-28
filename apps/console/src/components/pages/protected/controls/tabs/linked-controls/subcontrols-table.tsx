'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { hasPermission, canEdit } from '@/lib/authz/utils'
import { CreateButton } from '@/components/shared/create-button/create-button'
import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { DataTable } from '@repo/ui/data-table'
import type { TPagination } from '@repo/ui/pagination-types'
import { DEFAULT_PAGINATION } from '@/constants/pagination'
import { SearchFilterBar } from '@/components/shared/crud-base/tabs/shared'
import type { FilterField, WhereCondition } from '@/types'
import { useDebounce } from '@uidotdev/usehooks'
import { whereGenerator } from '@/components/shared/table-filter/where-generator'
import { getSubcontrolsColumns, getSubcontrolsFilterFields, type SubcontrolRow } from './subcontrols-table-config'
import { useGetSubcontrolsPaginated } from '@/lib/graphql-hooks/subcontrol'
import { SubcontrolControlSource, SubcontrolControlStatus, type SubcontrolWhereInput } from '@repo/codegen/src/schema'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { objectToSnakeCase } from '@/utils/strings'
import { Card } from '@repo/ui/cardpanel'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'

const SubcontrolsTable: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { convertToReadOnly } = usePlateEditor()
  const { data: orgPermission } = useOrganizationRoles()
  const { data: permission } = useAccountRoles(ObjectTypes.CONTROL, id)
  const [isOpen, setIsOpen] = useState(true)
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

  const { paginationMeta: approvedMeta } = useGetSubcontrolsPaginated({
    where: id ? { controlID: id, status: SubcontrolControlStatus.APPROVED } : undefined,
    pagination: { page: 1, pageSize: 1, query: { first: 1 } },
    enabled: Boolean(id),
  })

  const totalCount = paginationMeta?.totalCount ?? 0
  const implementedCount = approvedMeta?.totalCount ?? 0
  const implementedPercent = totalCount > 0 ? Math.round((implementedCount / totalCount) * 100) : 0

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

  const columns = useMemo(() => getSubcontrolsColumns({ controlId: id, convertToReadOnly }), [convertToReadOnly, id])

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold">Subcontrols</h2>
            <span className="text-sm text-muted-foreground">({totalCount} total)</span>
            {(hasPermission(orgPermission?.roles, AccessEnum.CanCreateSubcontrol) || canEdit(permission?.roles)) && <CreateButton type="subcontrol" href={`/controls/${id}/create-subcontrol`} />}
          </div>
          <div className="flex items-center gap-3">
            {totalCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${implementedPercent}%` }} />
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {implementedCount} of {totalCount} implemented
                </span>
              </div>
            )}
            <CollapsibleTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label={isOpen ? 'Collapse' : 'Expand'}>
                <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
              </button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <div className="space-y-4">
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
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

export default SubcontrolsTable
